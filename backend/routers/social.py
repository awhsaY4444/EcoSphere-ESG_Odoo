from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Employee, Challenge, ChallengeParticipation, CSRActivity, EmployeeParticipation, ApprovalStatusEnum, ChallengeStatusEnum, RoleEnum
from auth import get_current_active_user, require_role
from logic import APP_SETTINGS, evaluate_badges
from typing import List
from datetime import datetime

router = APIRouter(tags=["social"])

@router.get("/challenges", response_model=List[Challenge])
def get_challenges(session: Session = Depends(get_session)):
    return session.exec(select(Challenge)).all()

@router.post("/challenges/{challenge_id}/status")
def change_challenge_status(challenge_id: int, new_status: ChallengeStatusEnum, 
                            session: Session = Depends(get_session),
                            current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    challenge = session.exec(select(Challenge).where(Challenge.id == challenge_id)).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Enforce transitions: Draft -> Active -> Under_Review -> Completed. Or -> Archived from any.
    valid_transitions = {
        ChallengeStatusEnum.Draft: [ChallengeStatusEnum.Active, ChallengeStatusEnum.Archived],
        ChallengeStatusEnum.Active: [ChallengeStatusEnum.Under_Review, ChallengeStatusEnum.Archived],
        ChallengeStatusEnum.Under_Review: [ChallengeStatusEnum.Completed, ChallengeStatusEnum.Archived],
        ChallengeStatusEnum.Completed: [ChallengeStatusEnum.Archived],
        ChallengeStatusEnum.Archived: []
    }
    
    if new_status not in valid_transitions[challenge.status]:
        raise HTTPException(status_code=400, detail=f"Invalid transition from {challenge.status} to {new_status}")
        
    challenge.status = new_status
    session.add(challenge)
    session.commit()
    session.refresh(challenge)
    return challenge

@router.post("/challenge-participations/{participation_id}/approve")
def approve_challenge(participation_id: int, 
                      session: Session = Depends(get_session),
                      current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    participation = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
        
    challenge = session.exec(select(Challenge).where(Challenge.id == participation.challenge_id)).first()
    
    if APP_SETTINGS["evidence_required"] and challenge.evidence_required and not participation.proof_url:
        raise HTTPException(status_code=400, detail="Proof URL is required for this challenge")
        
    participation.approval = ApprovalStatusEnum.Approved
    participation.xp_awarded = challenge.xp
    
    # Award XP to user
    participant = session.exec(select(Employee).where(Employee.id == participation.employee_id)).first()
    participant.xp_total += challenge.xp
    
    session.add(participation)
    session.add(participant)
    session.commit()
    
    # Evaluate badges synchronously
    evaluate_badges(session, participant.id)
    
    return participation
