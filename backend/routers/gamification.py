from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Employee, Reward, RewardRedemption
from auth import get_current_active_user

router = APIRouter(tags=["gamification"])

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
