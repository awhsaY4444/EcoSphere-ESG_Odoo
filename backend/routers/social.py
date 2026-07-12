from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Employee, Challenge, ChallengeParticipation, CSRActivity, EmployeeParticipation, ApprovalStatusEnum, ChallengeStatusEnum, RoleEnum
from auth import get_current_active_user, require_role
from logic import APP_SETTINGS, evaluate_badges
from typing import List
from datetime import datetime

router = APIRouter(tags=["social"])

@router.get("/activities")
def get_activities(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    activities = session.exec(select(CSRActivity)).all()
    participations = session.exec(select(EmployeeParticipation).where(EmployeeParticipation.employee_id == current_user.id)).all()
    joined_activity_ids = {p.activity_id for p in participations}
    
    results = []
    colors = ["border-green-500", "border-red-500", "border-orange-500", "border-blue-500"]
    icons = ["🌲", "🩸", "🏖", "🎓"]
    for i, a in enumerate(activities):
        # Count participants
        joined = len(session.exec(select(EmployeeParticipation).where(EmployeeParticipation.activity_id == a.id)).all())
        results.append({
            "id": a.id,
            "title": a.title,
            "joined": joined,
            "evidenceReq": a.evidence_required,
            "icon": icons[i % len(icons)],
            "color": colors[i % len(colors)],
            "has_joined": a.id in joined_activity_ids
        })
    return results

@router.get("/approvals")
def get_approvals(session: Session = Depends(get_session)):
    parts = session.exec(select(EmployeeParticipation)).all()
    results = []
    for p in parts:
        emp = session.exec(select(Employee).where(Employee.id == p.employee_id)).first()
        act = session.exec(select(CSRActivity).where(CSRActivity.id == p.activity_id)).first()
        if emp and act:
            results.append({
                "id": p.id,
                "employee": emp.name,
                "activity": act.title,
                "proof": p.proof_url or "N/A",
                "points": p.points_earned,
                "status": p.approval_status,
                "statusColor": "border-green-500 text-green-500" if p.approval_status == "Approved" else "border-orange-500 text-orange-500"
            })
    return results

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
                      override_proof_url: str = None,
                      session: Session = Depends(get_session),
                      current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    participation = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
        
    if override_proof_url:
        participation.proof_url = override_proof_url
        
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

@router.post("/csr-participations/{participation_id}/approve")
def approve_csr(participation_id: int, 
                override_proof_url: str = None,
                session: Session = Depends(get_session),
                current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    participation = session.exec(select(EmployeeParticipation).where(EmployeeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="CSR Participation not found")
        
    if override_proof_url:
        participation.proof_url = override_proof_url
        
    activity = session.exec(select(CSRActivity).where(CSRActivity.id == participation.activity_id)).first()
    
    if APP_SETTINGS["evidence_required"] and activity.evidence_required and not participation.proof_url:
        raise HTTPException(status_code=400, detail="Proof URL is required for this CSR activity based on company policy")
        
    participation.approval_status = ApprovalStatusEnum.Approved
    participation.points_earned = activity.points_value
    
    # Award points to user
    participant = session.exec(select(Employee).where(Employee.id == participation.employee_id)).first()
    participant.points_balance += activity.points_value
    
    session.add(participation)
    session.add(participant)
    session.commit()
    
    # Evaluate badges synchronously
    evaluate_badges(session, participant.id)
    
    return participation

@router.post("/activities/{activity_id}/join")
def join_activity(activity_id: int, session: Session = Depends(get_session),
                  current_user: Employee = Depends(get_current_active_user)):
    # Check if exists
    activity = session.exec(select(CSRActivity).where(CSRActivity.id == activity_id)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="CSR Activity not found")
        
    # Check if already joined
    existing = session.exec(select(EmployeeParticipation)
                            .where(EmployeeParticipation.activity_id == activity_id)
                            .where(EmployeeParticipation.employee_id == current_user.id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already joined this activity")
        
    participation = EmployeeParticipation(
        activity_id=activity_id,
        employee_id=current_user.id,
        approval_status=ApprovalStatusEnum.Pending
    )
    session.add(participation)
    session.commit()
    session.refresh(participation)
    return participation

@router.post("/csr-participations/{participation_id}/reject")
def reject_csr(participation_id: int, 
               session: Session = Depends(get_session),
               current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    participation = session.exec(select(EmployeeParticipation).where(EmployeeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
        
    participation.approval_status = ApprovalStatusEnum.Rejected
    session.add(participation)
    session.commit()
    session.refresh(participation)
    
    return participation
