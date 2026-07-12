from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Employee, CarbonTransaction, EmissionFactor, DepartmentScore
from auth import get_current_active_user
from logic import APP_SETTINGS
from datetime import datetime

router = APIRouter(tags=["environmental"])

@router.get("/carbon-transactions", response_model=List[CarbonTransaction])
def get_carbon_transactions(session: Session = Depends(get_session)):
    return session.exec(select(CarbonTransaction)).all()

@router.post("/carbon-transactions", response_model=CarbonTransaction)
def create_carbon_transaction(tx: CarbonTransaction, session: Session = Depends(get_session),
                              current_user: Employee = Depends(get_current_active_user)):
    
    if APP_SETTINGS["auto_emission_calc"] and tx.quantity > 0:
        ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
        if not ef:
            raise HTTPException(status_code=404, detail="Emission Factor not found")
        tx.co2e_calculated = tx.quantity * ef.co2e_per_unit
        tx.auto_calculated = True
    else:
        # If auto-calc is off, we expect co2e_calculated to be provided manually
        if tx.co2e_calculated is None:
            raise HTTPException(status_code=400, detail="co2e_calculated must be provided when auto_emission_calc is off")
            
    session.add(tx)
    session.commit()
    session.refresh(tx)
    
    # Recalculate department score immediately
    calculate_and_save_department_score(session, tx.dept_id)
    
    return tx

<<<<<<< HEAD
@router.get("/goals")
def get_environmental_goals(session: Session = Depends(get_session)):
    from models import EnvironmentalGoal
    # For hackathon MVP we just return all goals
    goals = session.exec(select(EnvironmentalGoal)).all()
    # Add fake progress formatting for frontend mockup compatibility
    results = []
    for g in goals:
        progress = int((g.current_value / g.target_value) * 100) if g.target_value > 0 else 0
        status = "Completed" if progress >= 100 else ("Active" if progress > 0 else "Draft")
        results.append({
            "id": g.id,
            "name": g.title,
            "dept": "Department " + str(g.dept_id) if g.dept_id else "All",
            "target": str(g.target_value) + " " + g.target_metric,
            "current": str(g.current_value) + " " + g.target_metric,
=======
@router.put("/carbon-transactions/{tx_id}", response_model=CarbonTransaction)
def update_carbon_transaction(tx_id: int, tx_data: dict, session: Session = Depends(get_session),
                              current_user: Employee = Depends(get_current_active_user)):
    tx = session.exec(select(CarbonTransaction).where(CarbonTransaction.id == tx_id)).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Carbon transaction not found")
        
    old_dept_id = tx.dept_id
    
    if "dept_id" in tx_data:
        tx.dept_id = int(tx_data["dept_id"])
    if "source_type" in tx_data:
        tx.source_type = tx_data["source_type"]
    if "source_ref_id" in tx_data:
        tx.source_ref_id = tx_data["source_ref_id"]
    if "quantity" in tx_data:
        tx.quantity = float(tx_data["quantity"])
    if "emission_factor_id" in tx_data:
        tx.emission_factor_id = int(tx_data["emission_factor_id"])
    if "date" in tx_data:
        try:
            tx.date = datetime.fromisoformat(tx_data["date"].replace("Z", "+00:00"))
        except ValueError:
            tx.date = datetime.strptime(tx_data["date"][:10], "%Y-%m-%d")
            
    if APP_SETTINGS["auto_emission_calc"] and tx.quantity > 0:
        ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
        if not ef:
            raise HTTPException(status_code=404, detail="Emission Factor not found")
        tx.co2e_calculated = tx.quantity * ef.co2e_per_unit
        tx.auto_calculated = True
    else:
        if "co2e_calculated" in tx_data:
            tx.co2e_calculated = float(tx_data["co2e_calculated"])
        else:
            ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
            if ef:
                tx.co2e_calculated = tx.quantity * ef.co2e_per_unit
                
    session.add(tx)
    session.commit()
    session.refresh(tx)
    
    calculate_and_save_department_score(session, old_dept_id)
    if tx.dept_id != old_dept_id:
        calculate_and_save_department_score(session, tx.dept_id)
        
    return tx

@router.delete("/carbon-transactions/{tx_id}")
def delete_carbon_transaction(tx_id: int, session: Session = Depends(get_session),
                              current_user: Employee = Depends(get_current_active_user)):
    tx = session.exec(select(CarbonTransaction).where(CarbonTransaction.id == tx_id)).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Carbon transaction not found")
        
    dept_id = tx.dept_id
    session.delete(tx)
    session.commit()
    
    calculate_and_save_department_score(session, dept_id)
    return {"ok": True}

@router.get("/goals")
def get_environmental_goals(session: Session = Depends(get_session)):
    from models import EnvironmentalGoal, Department
    update_environmental_goals_progress(session)
    goals = session.exec(select(EnvironmentalGoal)).all()
    results = []
    for g in goals:
        title_lower = g.title.lower()
        metric_lower = g.target_metric.lower()
        is_reduction = any(kw in title_lower for kw in ["reduce", "optimize", "minimize", "cut", "decrease", "saving"]) or \
                       any(kw in metric_lower for kw in ["co2e", "carbon", "emission", "liter", "kwh", "kg"])
                       
        if is_reduction:
            if g.current_value <= g.target_value:
                progress = 100
            elif g.current_value > 0:
                progress = int((g.target_value / g.current_value) * 100)
            else:
                progress = 0
        else:
            if g.current_value >= g.target_value:
                progress = 100
            elif g.target_value > 0:
                progress = int((g.current_value / g.target_value) * 100)
            else:
                progress = 0
        progress = min(100, max(0, progress))
        status = "Completed" if progress >= 100 else ("Active" if progress > 0 else "Draft")
        
        dept_name = "All"
        if g.dept_id:
            dept = session.exec(select(Department).where(Department.id == g.dept_id)).first()
            if dept:
                dept_name = dept.name
                
        results.append({
            "id": g.id,
            "name": g.title,
            "dept": dept_name,
            "dept_id": g.dept_id,
            "target": f"{g.target_value} {g.target_metric}",
            "current": f"{g.current_value} {g.target_metric}",
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
            "progress": progress,
            "deadline": g.deadline.strftime("%Y-%m-%d"),
            "status": status,
            "statusColor": "border-green-500 text-green-500" if status == "Completed" else "border-blue-500 text-blue-500"
        })
    return results

@router.post("/goals")
def create_environmental_goal(goal: dict, session: Session = Depends(get_session)):
    from models import EnvironmentalGoal
    from datetime import datetime
<<<<<<< HEAD
    new_goal = EnvironmentalGoal(
        title=goal.get("title"),
        target_metric=goal.get("target_metric"),
        target_value=goal.get("target_value"),
        current_value=0.0,
        deadline=datetime.strptime(goal.get("deadline"), "%Y-%m-%d"),
        dept_id=goal.get("dept_id")
=======
    
    dept_id_val = goal.get("dept_id")
    if dept_id_val == "" or dept_id_val == "All" or dept_id_val is None:
        dept_id_val = None
    else:
        try:
            dept_id_val = int(dept_id_val)
        except (ValueError, TypeError):
            dept_id_val = None
            
    new_goal = EnvironmentalGoal(
        title=goal.get("title"),
        target_metric=goal.get("target_metric"),
        target_value=float(goal.get("target_value", 0)),
        current_value=float(goal.get("current_value", 0)),
        deadline=datetime.strptime(goal.get("deadline"), "%Y-%m-%d"),
        dept_id=dept_id_val
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
    )
    session.add(new_goal)
    session.commit()
    session.refresh(new_goal)
<<<<<<< HEAD
    return new_goal

=======
    
    if dept_id_val:
        calculate_and_save_department_score(session, dept_id_val)
        
    return new_goal

@router.put("/goals/{goal_id}")
def update_environmental_goal(goal_id: int, goal_data: dict, session: Session = Depends(get_session)):
    from models import EnvironmentalGoal
    goal = session.exec(select(EnvironmentalGoal).where(EnvironmentalGoal.id == goal_id)).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    old_dept_id = goal.dept_id
    
    if "title" in goal_data:
        goal.title = goal_data["title"]
    if "target_metric" in goal_data:
        goal.target_metric = goal_data["target_metric"]
    if "target_value" in goal_data:
        goal.target_value = float(goal_data["target_value"])
    if "current_value" in goal_data:
        goal.current_value = float(goal_data["current_value"])
    if "deadline" in goal_data:
        try:
            goal.deadline = datetime.strptime(goal_data["deadline"], "%Y-%m-%d")
        except ValueError:
            goal.deadline = datetime.fromisoformat(goal_data["deadline"].replace("Z", "+00:00"))
            
    if "dept_id" in goal_data:
        dept_id_val = goal_data["dept_id"]
        if dept_id_val == "" or dept_id_val == "All" or dept_id_val is None:
            goal.dept_id = None
        else:
            goal.dept_id = int(dept_id_val)
            
    session.add(goal)
    session.commit()
    session.refresh(goal)
    
    if old_dept_id:
        calculate_and_save_department_score(session, old_dept_id)
    if goal.dept_id and goal.dept_id != old_dept_id:
        calculate_and_save_department_score(session, goal.dept_id)
        
    return goal

>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
@router.delete("/goals/{goal_id}")
def delete_environmental_goal(goal_id: int, session: Session = Depends(get_session)):
    from models import EnvironmentalGoal
    goal = session.exec(select(EnvironmentalGoal).where(EnvironmentalGoal.id == goal_id)).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
<<<<<<< HEAD
    session.delete(goal)
    session.commit()
    return {"ok": True}

=======
    
    dept_id = goal.dept_id
    session.delete(goal)
    session.commit()
    
    if dept_id:
        calculate_and_save_department_score(session, dept_id)
        
    return {"ok": True}

# ==========================================
# INTELLIGENCE ENGINE & INNOVATIONS ENDPOINTS
# ==========================================

def update_environmental_goals_progress(session: Session, dept_id: int = None):
    from models import EnvironmentalGoal, CarbonTransaction, EmissionFactor
    
    query = select(EnvironmentalGoal)
    if dept_id is not None:
        query = query.where(EnvironmentalGoal.dept_id == dept_id)
    goals = session.exec(query).all()
    
    for goal in goals:
        if goal.dept_id is None:
            continue
            
        txs = session.exec(
            select(CarbonTransaction).where(CarbonTransaction.dept_id == goal.dept_id)
        ).all()
        
        total_val = 0.0
        metric_lower = goal.target_metric.lower()
        is_co2e = any(x in metric_lower for x in ["co2e", "carbon", "emission"])
        
        for tx in txs:
            ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
            if not ef:
                continue
                
            title_lower = goal.title.lower()
            source_matches = True
            if "diesel" in title_lower and "diesel" not in ef.activity_type.lower():
                source_matches = False
            elif ("electricity" in title_lower or "datacenter" in title_lower) and "electricity" not in ef.activity_type.lower():
                source_matches = False
            elif "flight" in title_lower and "flight" not in ef.activity_type.lower():
                source_matches = False
            elif "paper" in title_lower and "paper" not in ef.activity_type.lower():
                source_matches = False
                
            if source_matches:
                if is_co2e:
                    if "mt" in metric_lower:
                        total_val += tx.co2e_calculated / 1000.0
                    else:
                        total_val += tx.co2e_calculated
                else:
                    unit_match = (
                        ef.unit.lower() == metric_lower or
                        (ef.unit.lower() == "liter" and "litre" in metric_lower) or
                        (ef.unit.lower() == "kwh" and "kwh" in metric_lower)
                    )
                    if unit_match:
                        total_val += tx.quantity
                        
        goal.current_value = round(total_val, 1)
        session.add(goal)
    session.commit()

def calculate_and_save_department_score(session: Session, dept_id: int, period: str = "2026-Q3") -> DepartmentScore:
    from models import DepartmentScore, Department, CarbonTransaction, EnvironmentalGoal, Employee, EmployeeParticipation, ApprovalStatusEnum, Audit, ComplianceIssue, IssueStatusEnum, SeverityEnum, PolicyAcknowledgement, ESGPolicy
    from logic import APP_SETTINGS

    # Update goals progress from live database transactions
    update_environmental_goals_progress(session, dept_id)

    # 1. Environmental Score
    txs = session.exec(
        select(CarbonTransaction).where(CarbonTransaction.dept_id == dept_id)
    ).all()
    total_emissions = sum(tx.co2e_calculated for tx in txs)
    
    # Scale: deduct 1 point for every 100 kg CO2e emissions (caps score at min 10)
    env_score = max(10.0, 100.0 - (total_emissions / 100.0))
    
    # Adjust for goals progress
    goals = session.exec(
        select(EnvironmentalGoal).where(EnvironmentalGoal.dept_id == dept_id)
    ).all()
    if goals:
        total_prog = 0.0
        for g in goals:
            title_lower = g.title.lower()
            metric_lower = g.target_metric.lower()
            is_reduction = any(kw in title_lower for kw in ["reduce", "optimize", "minimize", "cut", "decrease", "saving"]) or \
                           any(kw in metric_lower for kw in ["co2e", "carbon", "emission", "liter", "kwh", "kg"])
            
            if is_reduction:
                if g.current_value <= g.target_value:
                    prog = 1.0
                elif g.current_value > 0:
                    prog = g.target_value / g.current_value
                else:
                    prog = 0.0
            else:
                if g.current_value >= g.target_value:
                    prog = 1.0
                elif g.target_value > 0:
                    prog = g.current_value / g.target_value
                else:
                    prog = 0.0
            total_prog += min(1.0, max(0.0, prog))
            
        avg_progress = total_prog / len(goals)
        env_score = min(100.0, env_score + (avg_progress * 15.0)) # Up to +15 bonus for goal completion

    # 2. Social Score
    employees = session.exec(select(Employee).where(Employee.dept_id == dept_id)).all()
    emp_ids = [e.id for e in employees]
    
    approved_participations = 0
    if emp_ids:
        participations = session.exec(
            select(EmployeeParticipation)
            .where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Approved)
        ).all()
        approved_participations = len([p for p in participations if p.employee_id in emp_ids])
        
    social_score = min(100.0, 50.0 + (approved_participations * 10.0))

    # 3. Governance Score
    audits = session.exec(select(Audit).where(Audit.dept_id == dept_id)).all()
    audit_ids = [a.id for a in audits]
    
    open_issues_penalty = 0
    if audit_ids:
        issues = session.exec(
            select(ComplianceIssue)
            .where(ComplianceIssue.status == IssueStatusEnum.Open)
        ).all()
        dept_issues = [i for i in issues if i.audit_id in audit_ids]
        for issue in dept_issues:
            if issue.severity == SeverityEnum.Critical:
                open_issues_penalty += 20
            elif issue.severity == SeverityEnum.High:
                open_issues_penalty += 12
            elif issue.severity == SeverityEnum.Medium:
                open_issues_penalty += 6
            else:
                open_issues_penalty += 2
                
    # Policy acknowledgements
    total_policies = session.exec(select(ESGPolicy)).all()
    policy_count = len(total_policies)
    policy_backlog_penalty = 0
    if emp_ids and policy_count > 0:
        total_expected_acks = len(emp_ids) * policy_count
        acks = session.exec(select(PolicyAcknowledgement)).all()
        dept_acks = [a for a in acks if a.employee_id in emp_ids]
        actual_acks = len(dept_acks)
        missing_acks = max(0, total_expected_acks - actual_acks)
        policy_backlog_penalty = missing_acks * 3
        
    gov_score = max(10.0, 100.0 - open_issues_penalty - policy_backlog_penalty)
    
    # 4. Weighted Total
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    total_score = (env_score * w_env) + (social_score * w_social) + (gov_score * w_gov)
    
    # Save
    existing_score = session.exec(
        select(DepartmentScore)
        .where(DepartmentScore.dept_id == dept_id)
        .where(DepartmentScore.period == period)
    ).first()
    
    if existing_score:
        existing_score.env_score = round(env_score, 1)
        existing_score.social_score = round(social_score, 1)
        existing_score.gov_score = round(gov_score, 1)
        existing_score.total_score = round(total_score, 1)
        session.add(existing_score)
        session.commit()
        session.refresh(existing_score)
        return existing_score
    else:
        new_score = DepartmentScore(
            dept_id=dept_id,
            env_score=round(env_score, 1),
            social_score=round(social_score, 1),
            gov_score=round(gov_score, 1),
            total_score=round(total_score, 1),
            period=period
        )
        session.add(new_score)
        session.commit()
        session.refresh(new_score)
        return new_score

@router.post("/simulate")
def simulate_scenario(payload: dict, session: Session = Depends(get_session)):
    from models import DepartmentScore, Department, CarbonTransaction, EmissionFactor
    from logic import APP_SETTINGS
    
    dept_id = payload.get("dept_id")
    reduction_percent = float(payload.get("reduction_percent", 0.0))
    activity_type = payload.get("activity_type")
    
    if not dept_id:
        raise HTTPException(status_code=400, detail="dept_id is required")
        
    dept = session.exec(select(Department).where(Department.id == dept_id)).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    current_score_record = calculate_and_save_department_score(session, dept_id)
    
    txs = session.exec(select(CarbonTransaction).where(CarbonTransaction.dept_id == dept_id)).all()
    total_current_emissions = sum(tx.co2e_calculated for tx in txs)
    
    target_txs_emissions = 0.0
    if activity_type:
        efs = session.exec(select(EmissionFactor).where(EmissionFactor.activity_type == activity_type)).all()
        ef_ids = {ef.id for ef in efs}
        target_txs_emissions = sum(tx.co2e_calculated for tx in txs if tx.emission_factor_id in ef_ids)
    else:
        target_txs_emissions = total_current_emissions
        
    reduction_co2e = target_txs_emissions * (reduction_percent / 100.0)
    projected_total_emissions = max(0.0, total_current_emissions - reduction_co2e)
    
    from models import EnvironmentalGoal
    goals = session.exec(select(EnvironmentalGoal).where(EnvironmentalGoal.dept_id == dept_id)).all()
    
    projected_goal_progresses = []
    total_projected_prog = 0.0
    for g in goals:
        g_proj_val = g.current_value
        title_lower = g.title.lower()
        metric_lower = g.target_metric.lower()
        is_reduction = any(kw in title_lower for kw in ["reduce", "optimize", "minimize", "cut", "decrease", "saving"]) or \
                       any(kw in metric_lower for kw in ["co2e", "carbon", "emission", "liter", "kwh", "kg"])
                       
        if is_reduction:
            if activity_type:
                ef_activity_match = False
                if "diesel" in activity_type.lower() and "diesel" in title_lower:
                    ef_activity_match = True
                elif "electricity" in activity_type.lower() and ("electricity" in title_lower or "datacenter" in title_lower):
                    ef_activity_match = True
                elif "flight" in activity_type.lower() and "flight" in title_lower:
                    ef_activity_match = True
                elif "paper" in activity_type.lower() and "paper" in title_lower:
                    ef_activity_match = True
                    
                is_carbon_goal = any(kw in metric_lower for kw in ["co2e", "carbon", "emission"])
                
                if ef_activity_match:
                    g_proj_val = max(0.0, g.current_value * (1.0 - reduction_percent / 100.0))
                elif is_carbon_goal:
                    reduction_amt = reduction_co2e / 1000.0 if "mt" in metric_lower else reduction_co2e
                    g_proj_val = max(0.0, g.current_value - reduction_amt)
            else:
                g_proj_val = max(0.0, g.current_value * (1.0 - reduction_percent / 100.0))
                
            if g.current_value <= g.target_value:
                curr_prog = 1.0
            elif g.current_value > 0:
                curr_prog = g.target_value / g.current_value
            else:
                curr_prog = 0.0
                
            if g_proj_val <= g.target_value:
                prog = 1.0
            elif g_proj_val > 0:
                prog = g.target_value / g_proj_val
            else:
                prog = 0.0
        else:
            if g.current_value >= g.target_value:
                curr_prog = 1.0
            elif g.target_value > 0:
                curr_prog = g.current_value / g.target_value
            else:
                curr_prog = 0.0
                
            if g.current_value >= g.target_value:
                prog = 1.0
            elif g.target_value > 0:
                prog = g.current_value / g.target_value
            else:
                prog = 0.0
                
        total_projected_prog += min(1.0, max(0.0, prog))
        projected_goal_progresses.append({
            "title": g.title,
            "current_progress": int(curr_prog * 100),
            "projected_progress": int(prog * 100)
        })
        
    avg_proj_progress = (total_projected_prog / len(goals)) if goals else 0.0
    
    projected_env_score = max(10.0, 100.0 - (projected_total_emissions / 100.0))
    if goals:
        projected_env_score = min(100.0, projected_env_score + (avg_proj_progress * 15.0))
        
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    
    current_overall = current_score_record.total_score
    projected_overall = (projected_env_score * w_env) + (current_score_record.social_score * w_social) + (current_score_record.gov_score * w_gov)
    
    activity_desc = activity_type if activity_type else "overall operational activities"
    recommendation = (
        f"By reducing {activity_desc} consumption by {reduction_percent}% in {dept.name}, "
        f"you will cut carbon emissions by {round(reduction_co2e, 1)} kg CO2e. "
        f"This drives your Environmental Score up from {current_score_record.env_score} to {round(projected_env_score, 1)}, "
        f"improving your Overall ESG score from {current_overall} to {round(projected_overall, 1)} (+{round(projected_overall - current_overall, 1)}). "
        f"We highly recommend converting this scenario into an Environmental Goal."
    )
    
    goal_impact_desc = "No active goals in department."
    if goals:
        impacts = []
        for p in projected_goal_progresses:
            if p["projected_progress"] > p["current_progress"]:
                impacts.append(f"Accelerates '{p['title']}' to {p['projected_progress']}% progress")
        if impacts:
            goal_impact_desc = "; ".join(impacts)
        else:
            goal_impact_desc = "Goal progress will remain on track."
            
    return {
        "dept_id": dept_id,
        "dept_name": dept.name,
        "current_emissions": round(total_current_emissions, 1),
        "projected_emissions": round(projected_total_emissions, 1),
        "co2e_reduction": round(reduction_co2e, 1),
        "current_env_score": current_score_record.env_score,
        "projected_env_score": round(projected_env_score, 1),
        "current_overall_score": current_overall,
        "projected_overall_score": round(projected_overall, 1),
        "recommendation": recommendation,
        "goal_impact": goal_impact_desc
    }

@router.get("/carbon-dna")
def get_carbon_dna(dept_id: int = None, session: Session = Depends(get_session)):
    from models import Department, CarbonTransaction, EmissionFactor
    
    if dept_id:
        depts = session.exec(select(Department).where(Department.id == dept_id)).all()
    else:
        depts = session.exec(select(Department)).all()
        
    all_txs = session.exec(select(CarbonTransaction)).all()
    org_total_emissions = sum(tx.co2e_calculated for tx in all_txs)
    
    department_nodes = []
    for d in depts:
        dept_txs = [tx for tx in all_txs if tx.dept_id == d.id]
        dept_total = sum(tx.co2e_calculated for tx in dept_txs)
        contribution_pct = round((dept_total / org_total_emissions * 100), 1) if org_total_emissions > 0 else 0.0
        
        sources_dict = {}
        for tx in dept_txs:
            sources_dict.setdefault(tx.source_type.value, []).append(tx)
            
        source_nodes = []
        for source_name, src_txs in sources_dict.items():
            source_total = sum(tx.co2e_calculated for tx in src_txs)
            
            tx_nodes = []
            for tx in src_txs:
                ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
                tx_nodes.append({
                    "id": tx.id,
                    "date": tx.date.strftime("%Y-%m-%d %H:%M"),
                    "source_ref": tx.source_ref_id,
                    "quantity": tx.quantity,
                    "unit": ef.unit if ef else "units",
                    "ef_rate": ef.co2e_per_unit if ef else 0.0,
                    "co2e": round(tx.co2e_calculated, 1),
                    "auto_calculated": tx.auto_calculated
                })
                
            source_nodes.append({
                "source_type": source_name,
                "total_co2e": round(source_total, 1),
                "transactions": tx_nodes
            })
            
        department_nodes.append({
            "dept_id": d.id,
            "dept_name": d.name,
            "dept_code": d.code,
            "total_co2e": round(dept_total, 1),
            "contribution_pct": contribution_pct,
            "sources": source_nodes
        })
        
    return {
        "org_total_co2e": round(org_total_emissions, 1),
        "departments": department_nodes
    }

@router.post("/ecopilot")
def ask_ecopilot(payload: dict, session: Session = Depends(get_session)):
    query = payload.get("query", "").lower()
    
    from models import DepartmentScore, Department, CarbonTransaction, EnvironmentalGoal, ComplianceIssue, IssueStatusEnum, EmployeeParticipation, ApprovalStatusEnum, ESGPolicy, PolicyAcknowledgement
    
    departments = session.exec(select(Department)).all()
    all_scores = []
    for d in departments:
        score = calculate_and_save_department_score(session, d.id)
        all_scores.append((d, score))
        
    all_txs = session.exec(select(CarbonTransaction)).all()
    all_goals = session.exec(select(EnvironmentalGoal)).all()
    
    if "decrease" in query or "drop" in query or "why did our score" in query or "why did our esg" in query:
        lowest_dept, lowest_score = min(all_scores, key=lambda x: x[1].total_score)
        dept_txs = [tx for tx in all_txs if tx.dept_id == lowest_dept.id]
        total_co2e = sum(tx.co2e_calculated for tx in dept_txs)
        
        from models import Audit
        audits = session.exec(select(Audit).where(Audit.dept_id == lowest_dept.id)).all()
        audit_ids = [a.id for a in audits]
        open_issues = []
        if audit_ids:
            issues = session.exec(select(ComplianceIssue).where(ComplianceIssue.status == IssueStatusEnum.Open)).all()
            open_issues = [i for i in issues if i.audit_id in audit_ids]
            
        answer = f"The ESG score is primarily constrained by the {lowest_dept.name} department, which has a total score of {lowest_score.total_score}."
        evidence = f"This is driven by high emissions of {round(total_co2e, 1)} kg CO2e and {len(open_issues)} open compliance issues."
        metric = f"DepartmentScore ID {lowest_score.id} (Env: {lowest_score.env_score}, Social: {lowest_score.social_score}, Gov: {lowest_score.gov_score})."
        explanation = f"High electricity and fuel consumption are dragging down the Environmental score, while unresolved audit findings decrease Governance compliance."
        recommended_action = f"Perform a What-If simulation for {lowest_dept.name} on energy reduction and assign compliance owners to resolve the {len(open_issues)} open issues."
        
    elif "attention" in query or "worst department" in query or "lowest" in query or "need attention" in query:
        lowest_dept, lowest_score = min(all_scores, key=lambda x: x[1].total_score)
        answer = f"The {lowest_dept.name} department needs immediate attention as it holds the lowest ESG score ({lowest_score.total_score}/100) across the company."
        evidence = f"Environmental Score: {lowest_score.env_score}, Social Score: {lowest_score.social_score}, Governance Score: {lowest_score.gov_score}."
        metric = f"Department '{lowest_dept.code}' Score Detail"
        explanation = "The department lags across both carbon footprints and policy acknowledgement backlog."
        recommended_action = f"Launch a new Environmental Goal for {lowest_dept.name} and request all managers to complete their policy acknowledgements."
        
    elif "goal" in query or "fail" in query or "miss" in query:
        failing_goal = None
        for g in all_goals:
            progress = (g.current_value / g.target_value * 100) if g.target_value > 0 else 100
            if progress < 50:
                failing_goal = g
                break
        if not failing_goal and all_goals:
            failing_goal = all_goals[0]
            
        if failing_goal:
            dept = session.exec(select(Department).where(Department.id == failing_goal.dept_id)).first()
            dept_name = dept.name if dept else "All Departments"
            progress = int((failing_goal.current_value / failing_goal.target_value) * 100) if failing_goal.target_value > 0 else 0
            
            answer = f"The goal '{failing_goal.title}' assigned to {dept_name} is at risk of failing to meet its target."
            evidence = f"Current progress is only {progress}% (Target: {failing_goal.target_value} {failing_goal.target_metric}, Current: {failing_goal.current_value} {failing_goal.target_metric}) with a deadline of {failing_goal.deadline.strftime('%Y-%m-%d')}."
            metric = f"EnvironmentalGoal ID {failing_goal.id}"
            explanation = "Operational activities in the department have not decreased diesel or electricity usage sufficiently to track towards the target."
            recommended_action = f"Run a What-If simulation in EcoTwin for {dept_name} to find suitable fleet or server energy offsets."
        else:
            answer = "All goals are currently tracking successfully."
            evidence = "No active goals have progress under 50% relative to their deadlines."
            metric = "EnvironmentalGoals list"
            explanation = "Emissions reductions are aligned with organizational targets."
            recommended_action = "Continue monitoring carbon transactions on a weekly basis."
            
    elif "driver" in query or "drive" in query or "carbon" in query or "emissions" in query:
        fleet_emissions = sum(tx.co2e_calculated for tx in all_txs if tx.source_type.value == "Fleet")
        purchase_emissions = sum(tx.co2e_calculated for tx in all_txs if tx.source_type.value == "Purchase")
        expense_emissions = sum(tx.co2e_calculated for tx in all_txs if tx.source_type.value == "Expense")
        mfg_emissions = sum(tx.co2e_calculated for tx in all_txs if tx.source_type.value == "Manufacturing")
        
        drivers = [
            ("Fleet (Fuel/Diesel)", fleet_emissions),
            ("Purchase (Electricity)", purchase_emissions),
            ("Expense (Supplies/Paper)", expense_emissions),
            ("Manufacturing", mfg_emissions)
        ]
        top_driver, top_val = max(drivers, key=lambda x: x[1])
        
        answer = f"The primary driver of the company's carbon footprint is {top_driver}."
        evidence = f"This source accounts for {round(top_val, 1)} kg CO2e out of {round(sum(tx.co2e_calculated for tx in all_txs), 1)} kg CO2e total emissions."
        metric = "CarbonTransaction breakdown by SourceType"
        explanation = "High reliance on internal combustion vehicles (fleet operations) or grid-sourced electricity generates the majority of greenhouse gas emissions."
        recommended_action = "Create a fleet efficiency target in Operations and run a 15% reduction scenario simulation in EcoTwin."

    elif "risk" in query:
        radar_risks = get_risk_radar(session)
        critical_risks = [r for r in radar_risks if r["level"] in ["Critical", "High"]]
        
        if critical_risks:
            top_risk = critical_risks[0]
            answer = f"The highest ESG risk detected is '{top_risk['entity']}' flagged as {top_risk['level']} priority."
            evidence = f"Evidence: {top_risk['evidence']}. Main driver: {top_risk['driver']}."
            metric = f"Risk Radar Data (Total {len(critical_risks)} active high/critical risks)"
            explanation = top_risk['reasoning']
            recommended_action = top_risk['recommended_action']
        else:
            answer = "No critical or high ESG risks are currently active."
            evidence = "0 high-level risks found in compliance, carbon limits, or policy backlog."
            metric = "Risk Radar List"
            explanation = "The organization satisfies standard compliance and carbon threshold levels."
            recommended_action = "Maintain regular environmental goals auditing."
            
    elif "improvement" in query or "improve" in query or "action" in query:
        lowest_dept, lowest_score = min(all_scores, key=lambda x: x[1].total_score)
        worst_metric = "Environmental"
        worst_val = lowest_score.env_score
        if lowest_score.social_score < worst_val:
            worst_metric = "Social"
            worst_val = lowest_score.social_score
        if lowest_score.gov_score < worst_val:
            worst_metric = "Governance"
            worst_val = lowest_score.gov_score
            
        answer = f"The action that would produce the largest ESG score improvement is addressing the {worst_metric} score ({worst_val}/100) in the {lowest_dept.name} department."
        
        if worst_metric == "Environmental":
            dept_txs = [tx for tx in all_txs if tx.dept_id == lowest_dept.id]
            total_co2e = sum(tx.co2e_calculated for tx in dept_txs)
            evidence = f"{lowest_dept.name} has carbon emissions of {round(total_co2e, 1)} kg CO2e."
            metric = f"DepartmentScore ID {lowest_score.id} (Env Score: {lowest_score.env_score})"
            explanation = "Improving energy efficiency or fleet routing here will immediately raise both the department and organizational Environmental scores."
            recommended_action = f"Run a What-If simulation in EcoTwin for {lowest_dept.name} and convert the optimal scenario to an Environmental Goal."
        elif worst_metric == "Social":
            evidence = f"Low CSR volunteering and challenge participation rate in {lowest_dept.name}."
            metric = f"DepartmentScore ID {lowest_score.id} (Social Score: {lowest_score.social_score})"
            explanation = "Increasing workforce CSR participation rates will raise the Social score."
            recommended_action = f"Launch a new gamified challenge for {lowest_dept.name} employees with points incentives."
        else:
            evidence = f"Unresolved compliance issues or unsigned policies in {lowest_dept.name}."
            metric = f"DepartmentScore ID {lowest_score.id} (Governance Score: {lowest_score.gov_score})"
            explanation = "Resolving overdue compliance audit findings reduces liability and increases the Governance score."
            recommended_action = f"Check the Risk Radar alerts, assign owners, and enforce policy sign-offs for all department staff."

    else:
        answer = "I can analyze your actual ESG database to explain trends, identify department bottlenecks, flag goals at risk, and recommend What-If simulations."
        evidence = "Awaiting specific queries about ESG scores, emission drivers, or risk alerts."
        metric = "General ESG database metadata"
        explanation = "Deterministic analyzer is ready to run analytics on Department Scores, Carbon Lineage, and compliance items."
        recommended_action = "Ask: 'Why did our score decrease?', 'Which department needs attention?', or 'What drives our carbon emissions?'"
        
    return {
        "answer": answer,
        "evidence": evidence,
        "metric": metric,
        "explanation": explanation,
        "recommended_action": recommended_action
    }

@router.get("/risk-radar")
def get_risk_radar(session: Session = Depends(get_session)):
    from models import Department, CarbonTransaction, EnvironmentalGoal, ComplianceIssue, IssueStatusEnum, SeverityEnum, Employee, EmployeeParticipation, ApprovalStatusEnum, PolicyAcknowledgement, ESGPolicy
    
    risks = []
    departments = session.exec(select(Department)).all()
    all_txs = session.exec(select(CarbonTransaction)).all()
    
    for d in departments:
        dept_txs = [tx for tx in all_txs if tx.dept_id == d.id]
        total_co2e = sum(tx.co2e_calculated for tx in dept_txs)
        if total_co2e > 3000:
            risks.append({
                "level": "High" if total_co2e > 5000 else "Medium",
                "entity": f"Emissions in {d.name}",
                "evidence": f"{round(total_co2e, 1)} kg CO2e total",
                "driver": "High energy or fuel usage",
                "reasoning": f"Emissions in {d.name} exceed critical departmental carbon budgets, dragging down the Environmental score.",
                "recommended_action": "Initiate an EcoTwin simulation to identify optimization areas."
            })
            
    goals = session.exec(select(EnvironmentalGoal)).all()
    for g in goals:
        title_lower = g.title.lower()
        metric_lower = g.target_metric.lower()
        is_reduction = any(kw in title_lower for kw in ["reduce", "optimize", "minimize", "cut", "decrease", "saving"]) or \
                       any(kw in metric_lower for kw in ["co2e", "carbon", "emission", "liter", "kwh", "kg"])
                       
        if is_reduction:
            progress = int((g.target_value / g.current_value * 100) if g.current_value > g.target_value else 100) if g.current_value > 0 else 0
        else:
            progress = int((g.current_value / g.target_value * 100) if g.target_value > 0 else 0)
        progress = min(100, max(0, progress))
        
        if progress < 40:
            dept = session.exec(select(Department).where(Department.id == g.dept_id)).first()
            dept_name = dept.name if dept else "All"
            risks.append({
                "level": "Critical",
                "entity": f"Goal: {g.title} ({dept_name})",
                "evidence": f"{int(progress)}% progress, deadline {g.deadline.strftime('%Y-%m-%d')}",
                "driver": "Insufficient progress rate",
                "reasoning": f"This goal is approaching its deadline with less than 40% progress achieved.",
                "recommended_action": "Increase resources or allocate departmental offsets immediately."
            })
            
    open_issues = session.exec(
        select(ComplianceIssue)
        .where(ComplianceIssue.status == IssueStatusEnum.Open)
    ).all()
    for issue in open_issues:
        from datetime import datetime
        if issue.due_date < datetime.utcnow():
            owner = session.exec(select(Employee).where(Employee.id == issue.owner_id)).first()
            owner_name = owner.name if owner else "Unassigned"
            risks.append({
                "level": "Critical" if issue.severity in [SeverityEnum.Critical, SeverityEnum.High] else "High",
                "entity": f"Compliance Issue: {issue.description}",
                "evidence": f"Overdue since {issue.due_date.strftime('%Y-%m-%d')} (Owner: {owner_name})",
                "driver": "Governance failure",
                "reasoning": f"An open compliance audit issue of severity '{issue.severity.value}' has passed its due date.",
                "recommended_action": f"Alert {owner_name} and escalate to resolve this risk."
            })
            
    for d in departments:
        employees = session.exec(select(Employee).where(Employee.dept_id == d.id)).all()
        emp_ids = [e.id for e in employees]
        if emp_ids:
            participations = session.exec(
                select(EmployeeParticipation)
                .where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Approved)
            ).all()
            dept_part = [p for p in participations if p.employee_id in emp_ids]
            if len(dept_part) == 0:
                risks.append({
                    "level": "Low" if len(employees) <= 2 else "Medium",
                    "entity": f"CSR Engagement in {d.name}",
                    "evidence": "0 approved CSR participations",
                    "driver": "Employee engagement gap",
                    "reasoning": "No employees in this department have completed verified sustainability or volunteering activities.",
                    "recommended_action": "Promote active CSR volunteering programs or create gamified department challenges."
                })
                
    total_policies = session.exec(select(ESGPolicy)).all()
    for d in departments:
        employees = session.exec(select(Employee).where(Employee.dept_id == d.id)).all()
        emp_ids = [e.id for e in employees]
        if emp_ids and len(total_policies) > 0:
            expected = len(emp_ids) * len(total_policies)
            acks = session.exec(select(PolicyAcknowledgement)).all()
            dept_acks = [a for a in acks if a.employee_id in emp_ids]
            pct = int((len(dept_acks) / expected) * 100) if expected > 0 else 0
            if pct < 50:
                risks.append({
                    "level": "High",
                    "entity": f"Policy Compliance in {d.name}",
                    "evidence": f"{pct}% policy acknowledgement rate",
                    "driver": "Policy backlog",
                    "reasoning": "More than half of the department's employees have not signed off on core corporate governance policies.",
                    "recommended_action": "Send automated reminders to all pending employees."
                })
                
    return risks

@router.get("/evidence-graph")
def get_evidence_graph(session: Session = Depends(get_session)):
    from models import Department, DepartmentScore
    
    departments = session.exec(select(Department)).all()
    
    total_env = 0
    total_soc = 0
    total_gov = 0
    total_employees = 0
    
    for d in departments:
        score = calculate_and_save_department_score(session, d.id)
        emp_count = d.employee_count
        total_env += (score.env_score * emp_count)
        total_soc += (score.social_score * emp_count)
        total_gov += (score.gov_score * emp_count)
        total_employees += emp_count
        
    overall_env = round(total_env / total_employees, 1) if total_employees > 0 else 0.0
    overall_soc = round(total_soc / total_employees, 1) if total_employees > 0 else 0.0
    overall_gov = round(total_gov / total_employees, 1) if total_employees > 0 else 0.0
    
    from logic import APP_SETTINGS
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    overall_score = round((overall_env * w_env) + (overall_soc * w_social) + (overall_gov * w_gov), 1)
    
    from models import CarbonTransaction, EnvironmentalGoal, EmployeeParticipation, ApprovalStatusEnum, ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
    
    env_txs = len(session.exec(select(CarbonTransaction)).all())
    env_goals = len(session.exec(select(EnvironmentalGoal)).all())
    soc_activities = len(session.exec(select(EmployeeParticipation).where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Approved)).all())
    gov_policies = len(session.exec(select(ESGPolicy)).all())
    gov_acks = len(session.exec(select(PolicyAcknowledgement)).all())
    gov_audits = len(session.exec(select(Audit)).all())
    gov_issues = len(session.exec(select(ComplianceIssue)).all())
    
    return {
        "name": f"Overall ESG Score: {overall_score}",
        "score": overall_score,
        "children": [
            {
                "name": f"🌱 Environmental: {overall_env}",
                "score": overall_env,
                "children": [
                    {"name": f"Carbon Transactions ({env_txs} records)", "detail": "Emissions calculated from operations"},
                    {"name": f"Environmental Goals ({env_goals} active)", "detail": "Sustainability targets for departments"}
                ]
            },
            {
                "name": f"🤝 Social: {overall_soc}",
                "score": overall_soc,
                "children": [
                    {"name": f"Verified Participations ({soc_activities} completions)", "detail": "Approved corporate social responsibility efforts"}
                ]
            },
            {
                "name": f"⚖️ Governance: {overall_gov}",
                "score": overall_gov,
                "children": [
                    {"name": f"Active Policies ({gov_policies} published)", "detail": "Corporate ESG guidelines"},
                    {"name": f"Policy Sign-offs ({gov_acks} confirmations)", "detail": "Signed policy agreements"},
                    {"name": f"Audits & Issues ({gov_audits} audits, {gov_issues} compliance items)", "detail": "Internal checks and safety status"}
                ]
            }
        ]
    }
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
