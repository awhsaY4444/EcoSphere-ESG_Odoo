from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Employee, Reward, RewardRedemption
from auth import get_current_active_user

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
    reward = session.exec(select(Reward).where(Reward.id == reward_id)).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
        
    if reward.stock <= 0:
        raise HTTPException(status_code=400, detail="Reward out of stock")
        
    if current_user.points_balance < reward.points_required:
        raise HTTPException(status_code=400, detail="Insufficient points")
        
    # Deduct points and stock
    current_user.points_balance -= reward.points_required
    reward.stock -= 1
    
    redemption = RewardRedemption(employee_id=current_user.id, reward_id=reward.id, points_spent=reward.points_required)
    
    session.add(current_user)
    session.add(reward)
    session.add(redemption)
    session.commit()
    session.refresh(redemption)
    
    return redemption

@router.get("/challenges")
def get_challenges(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    from models import Challenge, ChallengeParticipation
    challenges = session.exec(select(Challenge)).all()
    participations = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.employee_id == current_user.id)).all()
    joined_ids = {p.challenge_id for p in participations}
    
    results = []
    for c in challenges:
        results.append({
            "id": c.id,
            "title": c.title,
            "xp": c.xp,
            "difficulty": c.difficulty,
            "deadline": c.deadline.strftime("%m/%d") if c.deadline else "N/A",
            "status": c.status,
            "statusColor": "bg-green-600" if c.status == "Active" else "text-gray-400 bg-gray-800",
            "has_joined": c.id in joined_ids
        })
    return results

@router.get("/participations")
def get_participations(session: Session = Depends(get_session)):
    from models import ChallengeParticipation, Employee, Challenge
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
                "xp": cha.xp,
                "status": p.approval,
                "statusColor": "border-green-500 text-green-500" if p.approval == "Approved" else "border-orange-500 text-orange-500"
            })
    return results

@router.post("/challenges/{challenge_id}/join")
def join_challenge(challenge_id: int, session: Session = Depends(get_session),
                   current_user: Employee = Depends(get_current_active_user)):
    from models import ChallengeParticipation, ApprovalStatusEnum, Challenge
    
    # Check if challenge exists
    challenge = session.exec(select(Challenge).where(Challenge.id == challenge_id)).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Check if already joined
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

from pydantic import BaseModel
class ChallengeCreate(BaseModel):
    title: str
    xp: int = 100
    difficulty: str = "Medium"
    deadline: str = None
    status: str = "Draft"

@router.post("/challenges")
def create_challenge(challenge_data: ChallengeCreate, session: Session = Depends(get_session)):
    from models import Challenge, Category, CategoryTypeEnum
    from datetime import datetime
    
    # Try to parse deadline
    deadline_date = None
    if challenge_data.deadline:
        try:
            deadline_date = datetime.strptime(f"{datetime.now().year}-{challenge_data.deadline}", "%Y-%m/%d").date()
        except:
            deadline_date = datetime.now().date()
            
    cat = session.exec(select(Category).where(Category.type == CategoryTypeEnum.Challenge)).first()
    cat_id = cat.id if cat else 1
            
    c = Challenge(
        title=challenge_data.title,
        category_id=cat_id,
        description="Newly created challenge.",
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
    # Return all badges, but indicate which ones the user has earned
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
    from models import Employee, Department
    # Rank employees by xp_total
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
