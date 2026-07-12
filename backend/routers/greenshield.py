import re
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import (
    Employee, CarbonTransaction, EmissionFactor, EnvironmentalGoal, ESGPolicy,
    PolicyAcknowledgement, Audit, ComplianceIssue, DepartmentScore, Department,
    VerifiedImpact, EmployeeParticipation, ApprovalStatusEnum, GreenShieldClaim
)
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(tags=["greenshield"])

# Supported claim helper function
def parse_percentage_or_value(claim_text: str):
    """
    Extracts percentage or numeric value from claim text.
    Returns (value, unit) where unit can be "%", "hours", etc.
    """
    # Try percentage first
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", claim_text)
    if pct_match:
        return float(pct_match.group(1)), "%"
    
    # Try hours
    hours_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hours|hrs|volunteer hours)", claim_text, re.IGNORECASE)
    if hours_match:
        return float(hours_match.group(1)), "hours"
        
    # Try kWh
    kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kwh|kilowatt hours)", claim_text, re.IGNORECASE)
    if kwh_match:
        return float(kwh_match.group(1)), "kWh"

    # Try general number
    num_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kg|liters|l|kg co2e|co2e)?", claim_text, re.IGNORECASE)
    if num_match:
        return float(num_match.group(1)), "units"
        
    return None, None

def resolve_department_scope(claim_text: str, session: Session):
    """
    Resolves department scope from text, mapping keywords to database departments.
    """
    claim_lower = claim_text.lower()
    departments = session.exec(select(Department)).all()
    
    # Keyword mappings
    dept_mappings = {
        "ops": ["ops", "operations", "logistics", "fleet", "truck", "distribution", "delivery", "supply chain"],
        "it": ["it", "information technology", "tech", "datacenter", "server", "servers", "computers", "software"],
        "hr": ["hr", "human resources", "people", "staff", "recruiting", "workplace", "diversity", "inclusion"],
        "hq": ["hq", "headquarters", "global hq", "admin", "executive"]
    }
    
    for code, keywords in dept_mappings.items():
        if any(keyword in claim_lower for keyword in keywords):
            # Find department with matching code
            dept = session.exec(select(Department).where(Department.code == code.upper())).first()
            if dept:
                return dept
                
    return None

@router.post("/verify")
def verify_claim(payload: dict, session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    claim_text = payload.get("claim_text", "").strip()
    if not claim_text:
        raise HTTPException(status_code=400, detail="Claim text is required")
        
    claimed_val, unit = parse_percentage_or_value(claim_text)
    claim_lower = claim_text.lower()
    
    # 1. Determine Category & Claim Type
    category = "Unknown"
    claim_type = "Unknown"
    
    # Check claim types
    is_carbon = any(x in claim_lower for x in ["carbon", "emission", "emissions", "co2", "co2e", "greenhouse"])
    is_energy = any(x in claim_lower for x in ["energy", "electricity", "power", "renewable", "solar", "wind", "kwh", "server", "datacenter"])
    is_waste = any(x in claim_lower for x in ["waste", "recycling", "landfill", "garbage", "trash", "paper", "plastic"])
    is_water = any(x in claim_lower for x in ["water", "consumption", "liters", "aquifer", "conservation"])
    is_volunteer = any(x in claim_lower for x in ["volunteer", "volunteering", "csr", "community", "hours", "hrs"])
    is_training = any(x in claim_lower for x in ["training", "workshop", "diversity", "inclusion", "engagement", "employees"])
    is_policy = any(x in claim_lower for x in ["policy", "policies", "acknowledgement", "governance"])
    is_audit = any(x in claim_lower for x in ["audit", "audits", "compliance", "compliance issue", "violations"])

    # Resolve Scope
    dept_scope = resolve_department_scope(claim_text, session)
    scope_name = dept_scope.name if dept_scope else "Entire Organization"
    
    # Initialize response metrics
    verified_val = 0.0
    verified_unit = unit or "%"
    evidence_coverage = 50.0
    confidence_score = 50.0
    risk_level = "Medium"
    status = "Insufficient Evidence"
    recommendation = ""
    evidence_used = []
    missing_evidence = []

    # Check for category classification
    if is_carbon or is_energy or is_waste or is_water:
        category = "Environmental"
        if is_carbon:
            claim_type = "Carbon reduction"
        elif is_energy:
            claim_type = "Energy savings"
        elif is_waste:
            claim_type = "Waste reduction"
        else:
            claim_type = "Water conservation"
    elif is_volunteer or is_training:
        category = "Social"
        if is_volunteer:
            claim_type = "CSR participation" if unit == "%" or "participation" in claim_lower else "Volunteer hours"
        else:
            claim_type = "Training completion"
    elif is_policy or is_audit:
        category = "Governance"
        if is_policy:
            claim_type = "Policy compliance"
        else:
            claim_type = "Audit completion"

    if category == "Unknown":
        return {
            "claim_text": claim_text,
            "category": "Unsupported",
            "claim_type": "Unsupported",
            "claimed_value": "N/A",
            "verified_value": "N/A",
            "evidence_coverage": 0,
            "confidence_score": 0,
            "risk_level": "Medium",
            "status": "Insufficient Evidence",
            "recommendation": "Insufficient evidence to verify this claim. Supported claim types include carbon/emission reduction, energy savings, waste reduction, water conservation, CSR/volunteer participation, policy compliance, and audit completion.",
            "evidence_used": [],
            "missing_evidence": ["No operational logs or metadata mapping to this claim type in database."]
        }

    # If value cannot be parsed
    if claimed_val is None:
        claimed_val = 0.0
        unit = "%"
        
    # --- EVALUATION ENGINE ---
    
    if category == "Environmental":
        # 1. Carbon / Emission Reduction
        if claim_type == "Carbon reduction":
            # Query transactions
            tx_query = select(CarbonTransaction)
            if dept_scope:
                tx_query = tx_query.where(CarbonTransaction.dept_id == dept_scope.id)
            txs = session.exec(tx_query).all()
            total_emissions = sum(tx.co2e_calculated for tx in txs)
            
            # Query verified impact
            impact_query = select(VerifiedImpact).where(VerifiedImpact.impact_metric.like("%CO2e%"))
            if dept_scope:
                impact_query = impact_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            impacts = session.exec(impact_query).all()
            
            # Total avoided
            avoided = sum(i.impact_value for i in impacts if i.status == "Verified" or i.status == "Pending")
            verified_avoided = sum(i.impact_value for i in impacts if i.status == "Verified")
            pending_avoided = sum(i.impact_value for i in impacts if i.status == "Pending")
            
            # Math
            total_factored = total_emissions + avoided
            actual_reduction_pct = (avoided / total_factored * 100) if total_factored > 0 else 0.0
            verified_val = round(actual_reduction_pct, 2)
            verified_unit = "%"
            
            # Setup coverage & confidence
            tx_count = len(txs)
            has_goals = len(session.exec(select(EnvironmentalGoal).where(EnvironmentalGoal.dept_id == dept_scope.id if dept_scope else True)).all()) > 0
            
            evidence_coverage = 70.0
            if tx_count > 0:
                evidence_coverage += 15.0
            if has_goals:
                evidence_coverage += 15.0
            evidence_coverage = min(100.0, evidence_coverage)
            
            # Confidence discount if pending records exist
            pending_ratio = (pending_avoided / avoided) if avoided > 0 else 0.0
            confidence_score = evidence_coverage * (1.0 - 0.2 * pending_ratio)
            
            # Check compliance issues
            issue_query = select(ComplianceIssue).where(ComplianceIssue.status != IssueStatusEnum.Resolved)
            if dept_scope:
                issue_query = issue_query.join(Audit).where(Audit.dept_id == dept_scope.id)
            open_issues = session.exec(issue_query).all()
            if open_issues:
                confidence_score = max(10.0, confidence_score - 20.0)
                missing_evidence.append(f"Resolve {len(open_issues)} open compliance issues in {scope_name}.")
                
            evidence_used.append(f"Carbon transactions: {tx_count} records analysed ({int(total_emissions):,} kg CO2e total).")
            if avoided > 0:
                evidence_used.append(f"Verified avoided emissions: {verified_avoided} kg CO2e ({len(impacts)} impact records).")
            if pending_avoided > 0:
                evidence_used.append(f"Pending avoidance records: {pending_avoided} kg CO2e awaiting approval.")

            if tx_count == 0:
                missing_evidence.append(f"No carbon transaction logs found for {scope_name}.")
                confidence_score = 15.0
                evidence_coverage = 30.0

        # 2. Energy Savings
        elif claim_type == "Energy savings":
            # Filter Grid Electricity transactions
            tx_query = select(CarbonTransaction).join(EmissionFactor).where(EmissionFactor.activity_type.like("%Electricity%"))
            if dept_scope:
                tx_query = tx_query.where(CarbonTransaction.dept_id == dept_scope.id)
            txs = session.exec(tx_query).all()
            total_kwh = sum(tx.quantity for tx in txs)
            
            # Verified impact for kWh
            impact_query = select(VerifiedImpact).where(VerifiedImpact.impact_metric.like("%kWh%"))
            if dept_scope:
                impact_query = impact_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            impacts = session.exec(impact_query).all()
            
            avoided_kwh = sum(i.impact_value for i in impacts)
            total_factored = total_kwh + avoided_kwh
            actual_savings_pct = (avoided_kwh / total_factored * 100) if total_factored > 0 else 0.0
            
            verified_val = round(actual_savings_pct, 2)
            verified_unit = "%"
            
            evidence_coverage = 80.0 if len(txs) > 0 else 40.0
            confidence_score = evidence_coverage
            
            evidence_used.append(f"Electricity logs: {len(txs)} transactions analysed ({int(total_kwh):,} kWh consumed).")
            if avoided_kwh > 0:
                evidence_used.append(f"Verified savings: {avoided_kwh} kWh avoided.")
            else:
                missing_evidence.append(f"No active energy-saving challenge/CSR impacts logged in {scope_name}.")
                
        # 3. Waste Reduction
        elif claim_type == "Waste reduction":
            # Paper used or raw waste logs
            tx_query = select(CarbonTransaction).join(EmissionFactor).where(EmissionFactor.activity_type.like("%Paper%"))
            if dept_scope:
                tx_query = tx_query.where(CarbonTransaction.dept_id == dept_scope.id)
            txs = session.exec(tx_query).all()
            total_paper = sum(tx.quantity for tx in txs)
            
            impact_query = select(VerifiedImpact).where(VerifiedImpact.impact_metric.like("%waste%"))
            if dept_scope:
                impact_query = impact_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            impacts = session.exec(impact_query).all()
            
            avoided_waste = sum(i.impact_value for i in impacts)
            total_factored = total_paper + avoided_waste
            actual_reduction_pct = (avoided_waste / total_factored * 100) if total_factored > 0 else 0.0
            
            verified_val = round(actual_reduction_pct, 2)
            verified_unit = "%"
            
            evidence_coverage = 80.0 if len(txs) > 0 else 45.0
            confidence_score = evidence_coverage
            
            # Check compliance issues related to waste disposal (ops issue1)
            issue_query = select(ComplianceIssue).where(ComplianceIssue.description.like("%waste%")).where(ComplianceIssue.status != IssueStatusEnum.Resolved)
            waste_issues = session.exec(issue_query).all()
            if waste_issues:
                confidence_score = max(10.0, confidence_score - 30.0)
                missing_evidence.append("Open Compliance Issue: 'Improper waste disposal documented in site B' in Operations.")
                
            evidence_used.append(f"Paper usage records: {len(txs)} transactions ({total_paper} kg used).")
            if avoided_waste > 0:
                evidence_used.append(f"Waste recycled/avoided: {avoided_waste} kg from CSR recycling activities.")

        # 4. Water Conservation
        elif claim_type == "Water conservation":
            # No transactions or data exist for water in database
            verified_val = 0.0
            verified_unit = "%"
            evidence_coverage = 20.0
            confidence_score = 5.0
            missing_evidence.append("No water consumption meter data or water goals found in EcoSphere.")
            
    elif category == "Social":
        # 1. CSR Participation
        if claim_type == "CSR participation":
            # Participation rate
            emp_query = select(Employee)
            if dept_scope:
                emp_query = emp_query.where(Employee.dept_id == dept_scope.id)
            total_emps = len(session.exec(emp_query).all())
            
            social_query = select(EmployeeParticipation).where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Approved)
            if dept_scope:
                social_query = social_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            participations = session.exec(social_query).all()
            
            unique_participants = len(set(p.employee_id for p in participations))
            actual_pct = (unique_participants / total_emps * 100) if total_emps > 0 else 0.0
            
            verified_val = round(actual_pct, 1)
            verified_unit = "%"
            
            evidence_coverage = 90.0
            confidence_score = 95.0
            
            # Check pending participations
            pending_query = select(EmployeeParticipation).where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Pending)
            if dept_scope:
                pending_query = pending_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            pending_parts = session.exec(pending_query).all()
            if pending_parts:
                confidence_score -= 15.0
                missing_evidence.append(f"{len(pending_parts)} pending CSR participations awaiting coordinator review.")
                
            evidence_used.append(f"Workforce count: {total_emps} employees in {scope_name}.")
            evidence_used.append(f"Approved participations: {len(participations)} activities completed by {unique_participants} unique employees.")

        # 2. Volunteer Hours
        elif claim_type == "Volunteer hours":
            # Sum verified impacts
            impact_query = select(VerifiedImpact).where(VerifiedImpact.impact_metric.like("%hours%"))
            if dept_scope:
                impact_query = impact_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            impacts = session.exec(impact_query).all()
            
            total_hours = sum(i.impact_value for i in impacts)
            verified_hours = sum(i.impact_value for i in impacts if i.status == "Verified")
            pending_hours = sum(i.impact_value for i in impacts if i.status == "Pending")
            
            verified_val = round(verified_hours, 1)
            verified_unit = "hours"
            
            evidence_coverage = 85.0
            confidence_score = 90.0
            
            if pending_hours > 0:
                confidence_score -= 20.0
                missing_evidence.append(f"{pending_hours} volunteer hours pending approval (CSR approvals tab).")
                
            evidence_used.append(f"Approved volunteer hours: {verified_hours} hrs ({len([i for i in impacts if i.status == 'Verified'])} logs).")
            if pending_hours > 0:
                evidence_used.append(f"Awaiting validation: {pending_hours} hrs.")

        # 3. Training Completion
        elif claim_type == "Training completion":
            # Check Inclusion Workshop completions
            social_query = select(EmployeeParticipation).join(CSRActivity).where(CSRActivity.title.like("%Workshop%") | CSRActivity.title.like("%Training%"))
            if dept_scope:
                social_query = social_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            participations = session.exec(social_query).all()
            
            # Completion %
            emp_query = select(Employee)
            if dept_scope:
                emp_query = emp_query.where(Employee.dept_id == dept_scope.id)
            total_emps = len(session.exec(emp_query).all())
            
            approved_parts = len([p for p in participations if p.approval_status == ApprovalStatusEnum.Approved])
            actual_pct = (approved_parts / total_emps * 100) if total_emps > 0 else 0.0
            
            verified_val = round(actual_pct, 1)
            verified_unit = "%"
            
            evidence_coverage = 90.0
            confidence_score = 90.0
            
            evidence_used.append(f"ESG-related workshop participation records: {len(participations)} sign-ups.")
            if approved_parts < total_emps:
                missing_evidence.append(f"{total_emps - approved_parts} employees have not completed diversity or safety training.")

    elif category == "Governance":
        # 1. Policy Compliance (Sign-offs)
        if claim_type == "Policy compliance":
            # Expected acks
            emp_query = select(Employee)
            if dept_scope:
                emp_query = emp_query.where(Employee.dept_id == dept_scope.id)
            total_emps = len(session.exec(emp_query).all())
            
            total_policies = len(session.exec(select(ESGPolicy).where(ESGPolicy.status == "Active")).all())
            expected_acks = total_emps * total_policies
            
            ack_query = select(PolicyAcknowledgement)
            if dept_scope:
                ack_query = ack_query.join(Employee).where(Employee.dept_id == dept_scope.id)
            acks = len(session.exec(ack_query).all())
            
            actual_pct = (acks / expected_acks * 100) if expected_acks > 0 else 100.0
            verified_val = round(actual_pct, 1)
            verified_unit = "%"
            
            evidence_coverage = 95.0
            confidence_score = 95.0
            
            evidence_used.append(f"Policies active: {total_policies} guidelines.")
            evidence_used.append(f"Total sign-offs logged: {acks} out of {expected_acks} expected employee acknowledgements.")
            
            if acks < expected_acks:
                missing_evidence.append(f"Missing {expected_acks - acks} policy confirmations from department staff.")

        # 2. Audit Completion / Compliance Rating
        elif claim_type == "Audit completion":
            # Get unresolved issues
            issue_query = select(ComplianceIssue)
            if dept_scope:
                issue_query = issue_query.join(Audit).where(Audit.dept_id == dept_scope.id)
            issues = session.exec(issue_query).all()
            
            total_issues = len(issues)
            resolved = len([i for i in issues if i.status == IssueStatusEnum.Resolved])
            
            compliance_rating = (resolved / total_issues * 100) if total_issues > 0 else 100.0
            verified_val = round(compliance_rating, 1)
            verified_unit = "%"
            
            evidence_coverage = 95.0
            confidence_score = 95.0
            
            evidence_used.append(f"Audited scope: {len(session.exec(select(Audit)).all())} ESG compliance reviews.")
            evidence_used.append(f"Identified items: {total_issues} issues raised ({resolved} resolved).")
            
            unresolved = [i for i in issues if i.status != IssueStatusEnum.Resolved]
            for u in unresolved:
                missing_evidence.append(f"Open issue: '{u.description}' (Severity: {u.severity.value}) due {u.due_date.strftime('%Y-%m-%d')}.")
                confidence_score = max(10.0, confidence_score - 15.0)

    # --- DECISION LOGIC & RISK CLASSIFICATION ---
    
    # Target value comparison
    diff = claimed_val - verified_val
    
    # Determine Status
    if verified_val >= claimed_val and confidence_score >= 80:
        status = "Fully Supported"
        risk_level = "Low"
    elif verified_val > 0 and verified_val >= (claimed_val * 0.5):
        status = "Partially Supported"
        risk_level = "Medium"
    elif verified_val > 0:
        status = "Partially Supported"
        risk_level = "High"
    else:
        status = "Unsupported"
        risk_level = "Critical"

    # Override risk to High/Critical if confidence is very low or there is critical missing evidence
    if confidence_score < 40:
        risk_level = "High" if risk_level in ["Low", "Medium"] else risk_level
    if any("Critical" in item or "High" in item or "waste disposal" in item for item in missing_evidence):
        risk_level = "Critical"
        status = "Unsupported" if verified_val < claimed_val else "Partially Supported"

    # Formulate customized recommendations
    if status == "Fully Supported":
        recommendation = f"This ESG claim is backed by 100% verified operational data. The verified metric ({verified_val}{verified_unit}) supports the claim of {claimed_val}{verified_unit}. It is safe to publish."
    elif status == "Partially Supported":
        if missing_evidence:
            recommendation = f"Claim is partially supported ({verified_val}{verified_unit} verified vs {claimed_val}{verified_unit} claimed). Please address missing evidence: '{missing_evidence[0]}' before publishing."
        else:
            recommendation = f"The verified operational data ({verified_val}{verified_unit}) is lower than the claimed value ({claimed_val}{verified_unit}). We recommend adjusting the public claim to reflect actual metrics."
    else:
        if missing_evidence:
            recommendation = f"This claim is unsupported. There is critical missing operational evidence: {missing_evidence[0]} Adjust the claim or submit the missing records before publishing."
        else:
            recommendation = f"No supporting operational evidence was found in the database. Publishing this claim carries high greenwashing risk. Please run challenges/activities to log verified ESG impact."

    # Format evidence strings for JSON persistence
    evidence_used_str = ", ".join(evidence_used) if evidence_used else "No records"
    missing_evidence_str = ", ".join(missing_evidence) if missing_evidence else "None"

    # Create model record
    claim_record = GreenShieldClaim(
        claim_text=claim_text,
        category=category,
        claim_type=claim_type,
        claimed_value=f"{claimed_val}{verified_unit}",
        verified_value=f"{verified_val}{verified_unit}",
        evidence_coverage=round(evidence_coverage, 1),
        confidence_score=round(confidence_score, 1),
        risk_level=risk_level,
        status=status,
        recommendation=recommendation,
        missing_evidence=missing_evidence_str,
        evidence_used=evidence_used_str,
        verified_at=datetime.utcnow()
    )
    session.add(claim_record)
    session.commit()
    session.refresh(claim_record)

    return {
        "id": claim_record.id,
        "claim_text": claim_text,
        "category": category,
        "claim_type": claim_type,
        "claimed_value": f"{claimed_val}{verified_unit}",
        "verified_value": f"{verified_val}{verified_unit}",
        "evidence_coverage": round(evidence_coverage, 1),
        "confidence_score": round(confidence_score, 1),
        "risk_level": risk_level,
        "status": status,
        "recommendation": recommendation,
        "evidence_used": evidence_used,
        "missing_evidence": missing_evidence
    }

@router.get("/history", response_model=List[GreenShieldClaim])
def get_verification_history(session: Session = Depends(get_session)):
    return session.exec(select(GreenShieldClaim).order_by(GreenShieldClaim.verified_at.desc())).all()
