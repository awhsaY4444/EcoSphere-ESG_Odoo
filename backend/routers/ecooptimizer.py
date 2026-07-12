import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import (
    Employee, CarbonTransaction, EmissionFactor, EnvironmentalGoal, ESGPolicy,
    PolicyAcknowledgement, Audit, ComplianceIssue, DepartmentScore, Department,
    VerifiedImpact, EmployeeParticipation, ApprovalStatusEnum, EcoOptimizerHistory, IssueStatusEnum
)
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(tags=["ecooptimizer"])

# Define the master list of possible sustainability actions
ALL_ACTIONS = [
    {
        "id": "FLEET_ELEC",
        "name": "Fleet Electrification",
        "category": "Environmental",
        "sub_category": "Carbon Reduction",
        "dept_code": "OPS",
        "cost": 850000,
        "timeline_months": 9,
        "roi_rating": "Highest",
        "roi_multiplier": 3.8,
        "confidence_pct": 94,
        "base_co2e_reduction_kg": 5360,  # 80% of Operations diesel emissions
        "env_gain": 53.6,
        "social_gain": 0.0,
        "gov_gain": 0.0,
        "description": "Transition 80% of logistics fleet from diesel fuel to electric vehicles.",
        "explain_template": "Operations currently contributes {ops_emissions:,} kg CO2e ({ops_emissions_pct:.1f}% of organization emissions) through diesel fuel consumption. Upgrading to EVs eliminates 80% of this source, avoiding {co2e_avoided:,} kg CO2e and boosting Environmental Score by +{env_gain:.1f}."
    },
    {
        "id": "SOLAR_INSTALL",
        "name": "Solar Installation",
        "category": "Environmental",
        "sub_category": "Energy savings",
        "dept_code": "IT",
        "cost": 600000,
        "timeline_months": 6,
        "roi_rating": "Medium",
        "roi_multiplier": 2.2,
        "confidence_pct": 88,
        "base_co2e_reduction_kg": 1600,  # 50% of IT server electricity (4000 kWh)
        "env_gain": 16.0,
        "social_gain": 0.0,
        "gov_gain": 0.0,
        "description": "Install rooftop solar panels at HQ to offset server room grid electricity draw.",
        "explain_template": "The Information Technology department consumes {it_electricity:,} kWh of electricity for datacenter operations. Solar offsets 50% of grid draw, saving 4,000 kWh (+{env_gain:.1f} Environmental score points)."
    },
    {
        "id": "EE_EQUIP",
        "name": "Energy Efficient Equipment",
        "category": "Environmental",
        "sub_category": "Energy savings",
        "dept_code": "IT",
        "cost": 300000,
        "timeline_months": 4,
        "roi_rating": "Medium",
        "roi_multiplier": 1.8,
        "confidence_pct": 85,
        "base_co2e_reduction_kg": 1000,  # 2500 kWh saved
        "env_gain": 10.0,
        "social_gain": 0.0,
        "gov_gain": 0.0,
        "description": "Upgrade server racks to Energy Star certified green hardware.",
        "explain_template": "Replacing server room infrastructure with modern energy-efficient models satisfies the active 'Reduce Datacenter Electricity' environmental goal, yielding {co2e_avoided:,} kg CO2e savings."
    },
    {
        "id": "WASTE_REDUCE",
        "name": "Waste Reduction Initiative",
        "category": "Environmental",
        "sub_category": "Waste reduction",
        "dept_code": "OPS",
        "cost": 150000,
        "timeline_months": 3,
        "roi_rating": "Medium",
        "roi_multiplier": 1.5,
        "confidence_pct": 85,
        "base_co2e_reduction_kg": 225,  # 250 kg paper reduction
        "env_gain": 4.5,
        "social_gain": 0.0,
        "gov_gain": 5.0,  # Resolves waste finding
        "description": "Deploy standardized waste separation bins and organic composting on site.",
        "explain_template": "Deploying zero-waste sorting bins directly resolves compliance vulnerabilities in Operations ('Improper waste disposal documented in site B') while adding +{env_gain:.1f} Environmental points."
    },
    {
        "id": "COMPLIANCE_RESOLVE",
        "name": "Compliance Resolution Task Force",
        "category": "Governance",
        "sub_category": "Audit completion",
        "dept_code": "OPS",
        "cost": 200000,
        "timeline_months": 2,
        "roi_rating": "High",
        "roi_multiplier": 4.2,
        "confidence_pct": 95,
        "base_co2e_reduction_kg": 0,
        "env_gain": 0.0,
        "social_gain": 0.0,
        "gov_gain": 18.0,  # Recovers 18 penalty points
        "description": "Hire specialized coordinators to audit site B and resolve waste disposal findings.",
        "explain_template": "Operations currently carries {open_issues_count} compliance issues carrying active penalties. Resolving the High severity site-B violation recovers +18.0 Governance score points."
    },
    {
        "id": "POLICY_IMPROVE",
        "name": "ESG Policy Modernization",
        "category": "Governance",
        "sub_category": "Policy compliance",
        "dept_code": "HR",
        "cost": 50000,
        "timeline_months": 1,
        "roi_rating": "High",
        "roi_multiplier": 5.0,
        "confidence_pct": 90,
        "base_co2e_reduction_kg": 0,
        "env_gain": 0.0,
        "social_gain": 0.0,
        "gov_gain": 33.0,  # Resolves missing sign-offs
        "description": "Automate procurement guidelines and digitize HR policy sign-offs.",
        "explain_template": "Resolves active policy backlog. There are currently {missing_acks} missing employee policy acknowledgements. Upgrading the sign-off portal recovers up to 33.0 penalty points on Governance."
    },
    {
        "id": "SUSTAINABILITY_CAMPAIGN",
        "name": "Employee CSR Campaign",
        "category": "Social",
        "sub_category": "CSR participation",
        "dept_code": "HR",
        "cost": 80000,
        "timeline_months": 2,
        "roi_rating": "High",
        "roi_multiplier": 3.0,
        "confidence_pct": 90,
        "base_co2e_reduction_kg": 100,  # Encourages bike to work
        "env_gain": 2.0,
        "social_gain": 15.0,
        "gov_gain": 0.0,
        "description": "Corporate campaign to incentivize green challenge and CSR volunteering sign-ups.",
        "explain_template": "The corporate Social index stands at {current_social_score}. Activating an automated challenge engagement campaign will increase CSR participation by 40% and recover Social points."
    },
    {
        "id": "TRAINING_PROGS",
        "name": "Safety & Diversity Training",
        "category": "Social",
        "sub_category": "Training completion",
        "dept_code": "HR",
        "cost": 120000,
        "timeline_months": 2,
        "roi_rating": "Medium",
        "roi_multiplier": 2.0,
        "confidence_pct": 88,
        "base_co2e_reduction_kg": 0,
        "env_gain": 0.0,
        "social_gain": 10.0,
        "gov_gain": 6.0,  # Resolves safety training compliance finding
        "description": "Roll out comprehensive workforce training covering inclusion and operations safety.",
        "explain_template": "Directly addresses the compliance violation 'Missing safety training logs' in Operations (+6.0 Gov gain) while raising Social index metrics (+10.0 Social gain)."
    }
]

def get_current_stats(session: Session):
    """
    Retrieve live operational stats to grounds the engine explanations.
    """
    # Emitted carbon totals
    all_txs = session.exec(select(CarbonTransaction)).all()
    total_emissions = sum(tx.co2e_calculated for tx in all_txs)
    
    ops_dept = session.exec(select(Department).where(Department.code == "OPS")).first()
    ops_emissions = 0.0
    if ops_dept:
        ops_txs = session.exec(select(CarbonTransaction).where(CarbonTransaction.dept_id == ops_dept.id)).all()
        ops_emissions = sum(tx.co2e_calculated for tx in ops_txs)
        
    it_dept = session.exec(select(Department).where(Department.code == "IT")).first()
    it_electricity = 0.0
    if it_dept:
        # Sum Grid Electricity quantity (kWh)
        it_txs = session.exec(select(CarbonTransaction).where(CarbonTransaction.dept_id == it_dept.id)).all()
        for tx in it_txs:
            ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
            if ef and "electricity" in ef.activity_type.lower():
                it_electricity += tx.quantity

    # Compliance Issues
    open_issues = session.exec(select(ComplianceIssue).where(ComplianceIssue.status != IssueStatusEnum.Resolved)).all()
    open_issues_count = len(open_issues)
    
    # Policies and Acks
    total_employees = len(session.exec(select(Employee)).all())
    total_policies = len(session.exec(select(ESGPolicy).where(ESGPolicy.status == "Active")).all())
    expected_acks = total_employees * total_policies
    acks = len(session.exec(select(PolicyAcknowledgement)).all())
    missing_acks = max(0, expected_acks - acks)

    # Department score summary
    overall_social_score = 50.0
    scores = session.exec(select(DepartmentScore)).all()
    if scores:
        overall_social_score = sum(s.social_score for s in scores) / len(scores)

    return {
        "total_emissions": total_emissions,
        "ops_emissions": ops_emissions,
        "ops_emissions_pct": (ops_emissions / total_emissions * 100) if total_emissions > 0 else 0.0,
        "it_electricity": it_electricity,
        "open_issues_count": open_issues_count,
        "missing_acks": missing_acks,
        "current_social_score": round(overall_social_score, 1)
    }

@router.post("/optimize")
def optimize_actions(payload: dict, session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    budget = float(payload.get("budget", 0))
    target_dept = payload.get("target_dept", "All").strip()
    target_category = payload.get("target_category", "All").strip()
    timeline = int(payload.get("timeline", 12))
    priority = payload.get("priority", "Score Improvement").strip()

    # Validations
    if budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be a positive number.")
    if timeline <= 0:
        raise HTTPException(status_code=400, detail="Timeline must be at least 1 month.")

    # 1. Fetch live grounding stats
    stats = get_current_stats(session)

    # 2. Filter actions based on target scope, category, and timeline
    filtered_actions = []
    for action in ALL_ACTIONS:
        # Check timeline bounds
        if action["timeline_months"] > timeline:
            continue
            
        # Check department scope
        if target_dept != "All" and action["dept_code"] != target_dept:
            continue
            
        # Check category filter
        # Categories: Environmental, Social, Governance
        # Categories Map: "Carbon Reduction" -> Env, "Social Engagement" -> Social, "Governance Compliance" -> Gov
        if target_category != "All":
            cat_map = {
                "Carbon Reduction": "Environmental",
                "Social Engagement": "Social",
                "Governance Compliance": "Governance"
            }
            mapped_cat = cat_map.get(target_category)
            if mapped_cat and action["category"] != mapped_cat:
                continue
                
        # Action qualifies
        # Build explainability description dynamically using database values
        explain = action["explain_template"].format(
            ops_emissions=int(stats["ops_emissions"]),
            ops_emissions_pct=stats["ops_emissions_pct"],
            co2e_avoided=action["base_co2e_reduction_kg"],
            env_gain=action["env_gain"],
            it_electricity=int(stats["it_electricity"]),
            open_issues_count=stats["open_issues_count"],
            missing_acks=stats["missing_acks"],
            current_social_score=stats["current_social_score"]
        )
        
        action_copy = action.copy()
        action_copy["explanation"] = explain
        filtered_actions.append(action_copy)

    # 3. Find optimal combinations (Portfolios) that fit Budget & Timeline
    # We solve using binary subsets mapping
    n = len(filtered_actions)
    valid_portfolios = []
    
    for i in range(1 << n):
        portfolio = []
        total_cost = 0.0
        max_timeline = 0
        total_co2e_saved = 0.0
        total_env = 0.0
        total_soc = 0.0
        total_gov = 0.0
        
        for j in range(n):
            if (i >> j) & 1:
                portfolio.append(filtered_actions[j])
                total_cost += filtered_actions[j]["cost"]
                max_timeline = max(max_timeline, filtered_actions[j]["timeline_months"])
                total_co2e_saved += filtered_actions[j]["base_co2e_reduction_kg"]
                total_env += filtered_actions[j]["env_gain"]
                total_soc += filtered_actions[j]["social_gain"]
                total_gov += filtered_actions[j]["gov_gain"]
                
        if total_cost <= budget and max_timeline <= timeline and len(portfolio) > 0:
            # Weighted Overall Score Gain calculation
            # Environmental = 0.4, Social = 0.3, Governance = 0.3
            overall_gain = (total_env * 0.4) + (total_soc * 0.3) + (total_gov * 0.3)
            
            valid_portfolios.append({
                "actions": portfolio,
                "cost": total_cost,
                "max_timeline": max_timeline,
                "co2e_saved": total_co2e_saved,
                "env_gain": round(total_env, 1),
                "social_gain": round(total_soc, 1),
                "gov_gain": round(total_gov, 1),
                "overall_gain": round(overall_gain, 1),
                "roi_index": sum(a["roi_multiplier"] for a in portfolio) / len(portfolio) if len(portfolio) > 0 else 0
            })

    # Sort Portfolios based on selected priority
    if priority == "Carbon Reduction":
        valid_portfolios.sort(key=lambda p: (-p["co2e_saved"], p["cost"]))
    elif priority == "Cost Efficiency":
        valid_portfolios.sort(key=lambda p: (-p["roi_index"], p["cost"]))
    elif priority == "Compliance Resolution":
        valid_portfolios.sort(key=lambda p: (-p["gov_gain"], p["cost"]))
    else:  # "Score Improvement"
        valid_portfolios.sort(key=lambda p: (-p["overall_gain"], p["cost"]))

    # 4. Formulate Output Structure
    # If no actions or portfolios are valid
    if not valid_portfolios:
        return {
            "budget": budget,
            "timeline": timeline,
            "target_dept": target_dept,
            "target_category": target_category,
            "priority": priority,
            "optimal_portfolio": None,
            "ranked_recommendations": [],
            "message": "No valid action combinations found within the specified budget and timeline constraints. Try increasing the budget or timeline limits."
        }

    # Best Portfolio found
    best_p = valid_portfolios[0]
    
    # Sort individual actions to display as Ranked Recommendations list
    # Sort key depends on priority
    if priority == "Carbon Reduction":
        filtered_actions.sort(key=lambda a: (-a["base_co2e_reduction_kg"], a["cost"]))
    elif priority == "Cost Efficiency":
        filtered_actions.sort(key=lambda a: (-a["roi_multiplier"], a["cost"]))
    elif priority == "Compliance Resolution":
        filtered_actions.sort(key=lambda a: (-a["gov_gain"], a["cost"]))
    else:
        # Score Gain
        filtered_actions.sort(key=lambda a: (-((a["env_gain"] * 0.4) + (a["social_gain"] * 0.3) + (a["gov_gain"] * 0.3)), a["cost"]))

    # Setup ranked list output
    ranked_recs = []
    for rank, a in enumerate(filtered_actions[:4], 1):
        overall_gain = (a["env_gain"] * 0.4) + (a["social_gain"] * 0.3) + (a["gov_gain"] * 0.3)
        ranked_recs.append({
            "rank": rank,
            "id": a["id"],
            "name": a["name"],
            "cost": a["cost"],
            "timeline": f"{a['timeline_months']} months",
            "co2e_reduction_kg": a["base_co2e_reduction_kg"],
            "esg_gain_env": a["env_gain"],
            "esg_gain_social": a["social_gain"],
            "esg_gain_gov": a["gov_gain"],
            "esg_gain_overall": round(overall_gain, 1),
            "roi": a["roi_rating"],
            "confidence": a["confidence_pct"],
            "recommendation": "Highly Recommended" if rank == 1 else "Recommended" if rank <= 3 else "Alternative Strategy",
            "explanation": a["explanation"]
        })

    # Prepare portfolio action names for database persistence
    portfolio_actions_names = [act["name"] for act in best_p["actions"]]
    
    # Calculate carbon reduction percentage relative to total organization emissions
    total_org_co2 = stats["total_emissions"]
    co2_pct_reduction = (best_p["co2e_saved"] / total_org_co2 * 100) if total_org_co2 > 0 else 0.0

    # Save to optimization history database
    history_record = EcoOptimizerHistory(
        budget=budget,
        target_dept=target_dept,
        target_category=target_category,
        timeline=timeline,
        priority=priority,
        recommended_portfolio=", ".join(portfolio_actions_names),
        expected_esg_gain=best_p["overall_gain"],
        carbon_reduction_pct=round(co2_pct_reduction, 1),
        total_cost=best_p["cost"],
        optimized_at=datetime.utcnow()
    )
    session.add(history_record)
    session.commit()
    session.refresh(history_record)

    # Return response payload
    return {
        "id": history_record.id,
        "budget": budget,
        "timeline": timeline,
        "target_dept": target_dept,
        "target_category": target_category,
        "priority": priority,
        
        "optimal_portfolio": {
            "actions": portfolio_actions_names,
            "cost": best_p["cost"],
            "timeline": f"{best_p['max_timeline']} months",
            "co2e_saved": best_p["co2e_saved"],
            "co2e_pct_reduction": round(co2_pct_reduction, 1),
            "env_gain": best_p["env_gain"],
            "social_gain": best_p["social_gain"],
            "gov_gain": best_p["gov_gain"],
            "overall_gain": best_p["overall_gain"]
        },
        "ranked_recommendations": ranked_recs
    }

@router.get("/history", response_model=List[EcoOptimizerHistory])
def get_optimizer_history(session: Session = Depends(get_session)):
    return session.exec(select(EcoOptimizerHistory).order_by(EcoOptimizerHistory.optimized_at.desc())).all()
