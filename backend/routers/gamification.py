from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import (
    Employee, Reward, RewardRedemption, Challenge, ChallengeParticipation, 
    VerifiedImpact, Notification, StatusEnum, ApprovalStatusEnum, ChallengeStatusEnum,
    Category, CategoryTypeEnum, RoleEnum
)
from auth import get_current_active_user, require_role
from logic import evaluate_badges
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(tags=["gamification"])

@router.get("/me")
def get_my_stats(current_user: Employee = Depends(get_current_active_user)):
    return {
        "xp": current_user.xp_total,
        "points": current_user.points_balance
    }

@router.post("/redemptions")
def redeem_reward(reward_id: int, session: Session = Depends(get_session),
                  current_user: Employee = Depends(get_current_active_user)):
    # Start atomic block
    try:
        # Load reward
        reward = session.exec(select(Reward).where(Reward.id == reward_id)).first()
        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")
            
        if reward.status != StatusEnum.Active:
            raise HTTPException(status_code=400, detail="Reward is not currently active")
            
        if reward.stock <= 0:
            raise HTTPException(status_code=400, detail="Reward out of stock")
            
        # Re-fetch user in this session transaction context
        user = session.exec(select(Employee).where(Employee.id == current_user.id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User session not found")
            
        if user.points_balance < reward.points_required:
            raise HTTPException(status_code=400, detail="Insufficient points balance for redemption")
            
        # Deduct points and stock atomically
        user.points_balance -= reward.points_required
        reward.stock -= 1
        
        redemption = RewardRedemption(
            employee_id=user.id,
            reward_id=reward.id,
            points_spent=reward.points_required
        )
        session.add(user)
        session.add(reward)
        session.add(redemption)
        session.commit()
        
        # Trigger success notification
        notif = Notification(
            employee_id=user.id,
            type="Reward",
            message=f"You successfully redeemed '{reward.name}' for {reward.points_required} points!"
        )
        session.add(notif)
        session.commit()
        
        session.refresh(redemption)
        return redemption

    except Exception as e:
        session.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database redemption transaction failed: {str(e)}")

@router.get("/challenges")
def get_challenges(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    challenges = session.exec(select(Challenge)).all()
    participations = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.employee_id == current_user.id)).all()
    joined_ids = {p.challenge_id for p in participations}
    
    results = []
    for c in challenges:
        results.append({
            "id": c.id,
            "title": c.title,
            "xp": c.xp,
            "description": c.description,
            "difficulty": c.difficulty,
            "deadline": c.deadline.strftime("%Y-%m-%d") if c.deadline else "N/A",
            "status": c.status,
            "statusColor": "bg-green-600" if c.status == ChallengeStatusEnum.Active else "text-gray-400 bg-gray-800",
            "has_joined": c.id in joined_ids
        })
    return results

@router.get("/participations")
def get_participations(session: Session = Depends(get_session)):
    parts = session.exec(select(ChallengeParticipation)).all()
    results = []
    for p in parts:
        emp = session.exec(select(Employee).where(Employee.id == p.employee_id)).first()
        cha = session.exec(select(Challenge).where(Challenge.id == p.challenge_id)).first()
        if emp and cha:
            results.append({
                "id": p.id,
                "employee": emp.name,
                "challenge": cha.title,
                "proof": p.proof_url or "N/A",
                "proof_description": p.proof_description or "No description provided",
                "xp": cha.xp,
                "status": p.approval,
                "statusColor": "border-green-500 text-green-500" if p.approval == ApprovalStatusEnum.Approved else "border-red-500 text-red-500" if p.approval == ApprovalStatusEnum.Rejected else "border-orange-500 text-orange-500"
            })
    return results

@router.post("/challenges/{challenge_id}/join")
def join_challenge(challenge_id: int, session: Session = Depends(get_session),
                   current_user: Employee = Depends(get_current_active_user)):
    challenge = session.exec(select(Challenge).where(Challenge.id == challenge_id)).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    existing = session.exec(select(ChallengeParticipation)
                            .where(ChallengeParticipation.challenge_id == challenge_id)
                            .where(ChallengeParticipation.employee_id == current_user.id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already joined this challenge")
        
    participation = ChallengeParticipation(
        challenge_id=challenge_id,
        employee_id=current_user.id,
        approval=ApprovalStatusEnum.Pending
    )
    session.add(participation)
    session.commit()
    session.refresh(participation)
    return participation

class ChallengeCreate(BaseModel):
    title: str
    xp: int = 100
    difficulty: str = "Medium"
    deadline: str = None
    status: str = "Draft"

@router.post("/challenges")
def create_challenge(challenge_data: ChallengeCreate, session: Session = Depends(get_session),
                     current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    deadline_date = None
    if challenge_data.deadline:
        try:
            deadline_date = datetime.strptime(challenge_data.deadline, "%Y-%m-%d")
        except:
            deadline_date = datetime.utcnow() + timedelta(days=7)
            
    cat = session.exec(select(Category).where(Category.type == CategoryTypeEnum.Challenge)).first()
    cat_id = cat.id if cat else 1
            
    c = Challenge(
        title=challenge_data.title,
        category_id=cat_id,
        description="Participate in this sustainability challenge to earn corporate recognition.",
        xp=challenge_data.xp,
        difficulty=challenge_data.difficulty,
        deadline=deadline_date,
        status=challenge_data.status
    )
    session.add(c)
    session.commit()
    session.refresh(c)
    return c

@router.get("/badges")
def get_user_badges(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    from models import Badge, EmployeeBadge
    all_badges = session.exec(select(Badge)).all()
    earned_badge_ids = {eb.badge_id for eb in session.exec(select(EmployeeBadge).where(EmployeeBadge.employee_id == current_user.id)).all()}
    
    results = []
    for b in all_badges:
        results.append({
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "earned": b.id in earned_badge_ids
        })
    return results

@router.get("/leaderboard")
def get_leaderboard(session: Session = Depends(get_session)):
    employees = session.exec(select(Employee).order_by(Employee.xp_total.desc()).limit(10)).all()
    results = []
    for i, emp in enumerate(employees):
        dept = session.exec(select(Department).where(Department.id == emp.dept_id)).first()
        results.append({
            "rank": i + 1,
            "name": emp.name,
            "department": dept.name if dept else "N/A",
            "xp": emp.xp_total
        })
    return results

@router.get("/leaderboard/impact")
def get_impact_leaderboard(metric: str = "volunteer hours", session: Session = Depends(get_session)):
    # Sum verified impact value grouped by employee_id for the given metric
    entries = session.exec(
        select(VerifiedImpact)
        .where(VerifiedImpact.status == "Verified")
        .where(VerifiedImpact.impact_metric == metric)
    ).all()
    
    employee_sums = {}
    for e in entries:
        employee_sums[e.employee_id] = employee_sums.get(e.employee_id, 0.0) + e.impact_value
        
    results = []
    for emp_id, total_val in employee_sums.items():
        emp = session.exec(select(Employee).where(Employee.id == emp_id)).first()
        if emp:
            dept = session.exec(select(Department).where(Department.id == emp.dept_id)).first()
            results.append({
                "name": emp.name,
                "department": dept.name if dept else "N/A",
                "impact_value": round(total_val, 2),
                "metric": metric
            })
            
    # Sort descending by impact_value
    results.sort(key=lambda x: x["impact_value"], reverse=True)
    
    # Add rank
    for idx, r in enumerate(results):
        r["rank"] = idx + 1
        
    return results
