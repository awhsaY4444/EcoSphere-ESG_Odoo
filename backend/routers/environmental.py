from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Employee, CarbonTransaction, EmissionFactor
from auth import get_current_active_user
from logic import APP_SETTINGS

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
    return tx

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
    new_goal = EnvironmentalGoal(
        title=goal.get("title"),
        target_metric=goal.get("target_metric"),
        target_value=goal.get("target_value"),
        current_value=0.0,
        deadline=datetime.strptime(goal.get("deadline"), "%Y-%m-%d"),
        dept_id=goal.get("dept_id")
    )
    session.add(new_goal)
    session.commit()
    session.refresh(new_goal)
    return new_goal

@router.delete("/goals/{goal_id}")
def delete_environmental_goal(goal_id: int, session: Session = Depends(get_session)):
    from models import EnvironmentalGoal
    goal = session.exec(select(EnvironmentalGoal).where(EnvironmentalGoal.id == goal_id)).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    session.delete(goal)
    session.commit()
    return {"ok": True}

