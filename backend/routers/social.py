from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import (
    Employee, Challenge, ChallengeParticipation, CSRActivity, EmployeeParticipation, 
    ApprovalStatusEnum, ChallengeStatusEnum, RoleEnum, VerifiedImpact, Notification
)
from auth import get_current_active_user, require_role
from logic import APP_SETTINGS, evaluate_badges
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(tags=["social"])

# Request/Response schemas
class CSRActivityCreate(BaseModel):
    title: str
    points_value: int
    description: str
    evidence_required: bool = False
    category_id: Optional[int] = None

class EvidenceSubmit(BaseModel):
    proof_url: Optional[str] = None
    proof_description: Optional[str] = None
    impact_value: Optional[float] = 0.0
    impact_metric: Optional[str] = ""

@router.get("/activities")
def get_activities(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    activities = session.exec(select(CSRActivity)).all()
    participations = session.exec(select(EmployeeParticipation).where(EmployeeParticipation.employee_id == current_user.id)).all()
    joined_activity_ids = {p.activity_id for p in participations}
    
    results = []
    colors = ["border-green-500", "border-red-500", "border-orange-500", "border-blue-500"]
    icons = ["🌲", "♻️", "🏖", "🎓"]
    for i, a in enumerate(activities):
        joined = len(session.exec(select(EmployeeParticipation).where(EmployeeParticipation.activity_id == a.id)).all())
        results.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "points": a.points_value,
            "joined": joined,
            "evidenceReq": a.evidence_required,
            "icon": icons[i % len(icons)],
            "color": colors[i % len(colors)],
            "has_joined": a.id in joined_activity_ids
        })
    return results

@router.post("/activities")
def create_activity(activity_data: CSRActivityCreate, 
                    session: Session = Depends(get_session),
                    current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    from models import Category, CategoryTypeEnum
    cat_id = activity_data.category_id
    if not cat_id:
        cat = session.exec(select(Category).where(Category.type == CategoryTypeEnum.CSR_Activity)).first()
        if not cat:
            cat = Category(name="CSR Initiatives", type=CategoryTypeEnum.CSR_Activity)
            session.add(cat)
            session.commit()
            session.refresh(cat)
        cat_id = cat.id
        
    activity = CSRActivity(
        title=activity_data.title,
        points_value=activity_data.points_value,
        description=activity_data.description,
        evidence_required=activity_data.evidence_required,
        category_id=cat_id
    )
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity

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
                "proof_description": p.proof_description or "No description provided",
                "points": p.points_earned,
                "status": p.approval_status,
                "statusColor": "border-green-500 text-green-500" if p.approval_status == "Approved" else "border-red-500 text-red-500" if p.approval_status == "Rejected" else "border-orange-500 text-orange-500"
            })
    return results

@router.post("/activities/{activity_id}/join")
def join_activity(activity_id: int, session: Session = Depends(get_session),
                  current_user: Employee = Depends(get_current_active_user)):
    activity = session.exec(select(CSRActivity).where(CSRActivity.id == activity_id)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="CSR Activity not found")
        
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

@router.post("/csr-participations/{participation_id}/submit-evidence")
def submit_csr_evidence(participation_id: int,
                        evidence: EvidenceSubmit,
                        session: Session = Depends(get_session),
                        current_user: Employee = Depends(get_current_active_user)):
    participation = session.exec(select(EmployeeParticipation).where(EmployeeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="CSR Participation not found")
    if participation.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this participation")
        
    activity = session.exec(select(CSRActivity).where(CSRActivity.id == participation.activity_id)).first()
    if APP_SETTINGS["evidence_required"] and activity.evidence_required and not evidence.proof_url and not evidence.proof_description:
        raise HTTPException(status_code=400, detail="Evidence URL or description is required for this activity")
        
    participation.proof_url = evidence.proof_url
    participation.proof_description = evidence.proof_description
    participation.approval_status = ApprovalStatusEnum.Pending
    session.add(participation)
    
    # Claimed Impact
    if evidence.impact_value and evidence.impact_value > 0 and evidence.impact_metric:
        existing_impact = session.exec(
            select(VerifiedImpact)
            .where(VerifiedImpact.participation_type == "CSR")
            .where(VerifiedImpact.participation_id == participation.id)
        ).first()
        
        if existing_impact:
            existing_impact.impact_value = evidence.impact_value
            existing_impact.impact_metric = evidence.impact_metric
            existing_impact.status = "Pending"
            session.add(existing_impact)
        else:
            impact = VerifiedImpact(
                employee_id=current_user.id,
                participation_type="CSR",
                participation_id=participation.id,
                activity_title=activity.title,
                impact_value=evidence.impact_value,
                impact_metric=evidence.impact_metric,
                status="Pending"
            )
            session.add(impact)
            
    session.commit()
    
    notif = Notification(
        employee_id=current_user.id,
        type="Approval",
        message=f"Evidence submitted for CSR Activity '{activity.title}'. Awaiting review."
    )
    session.add(notif)
    session.commit()
    return {"message": "Evidence submitted successfully", "status": "Pending"}

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
    
    if APP_SETTINGS["evidence_required"] and activity.evidence_required and not participation.proof_url and not participation.proof_description:
        raise HTTPException(status_code=400, detail="Proof (URL or description) is required for this CSR activity based on company policy")
        
    participation.approval_status = ApprovalStatusEnum.Approved
    participation.points_earned = activity.points_value
    participation.completion_date = datetime.utcnow()
    
    participant = session.exec(select(Employee).where(Employee.id == participation.employee_id)).first()
    participant.points_balance += activity.points_value
    
    # Verify associated impact
    impact = session.exec(
        select(VerifiedImpact)
        .where(VerifiedImpact.participation_type == "CSR")
        .where(VerifiedImpact.participation_id == participation.id)
    ).first()
    if impact:
        impact.status = "Verified"
        session.add(impact)
        
    session.add(participation)
    session.add(participant)
    session.commit()
    
    # Notify user
    notif = Notification(
        employee_id=participant.id,
        type="Approval",
        message=f"Your participation in CSR Activity '{activity.title}' was approved! +{activity.points_value} Points earned."
    )
    session.add(notif)
    session.commit()
    
    # Recalculate Department Score
    from routers.environmental import calculate_and_save_department_score
    if participant.dept_id:
        calculate_and_save_department_score(session, participant.dept_id)
        
    # Evaluate badges
    evaluate_badges(session, participant.id)
    
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
    
    impact = session.exec(
        select(VerifiedImpact)
        .where(VerifiedImpact.participation_type == "CSR")
        .where(VerifiedImpact.participation_id == participation.id)
    ).first()
    if impact:
        impact.status = "Rejected"
        session.add(impact)
        
    session.commit()
    
    act = session.exec(select(CSRActivity).where(CSRActivity.id == participation.activity_id)).first()
    notif = Notification(
        employee_id=participation.employee_id,
        type="Approval",
        message=f"Your participation in CSR Activity '{act.title if act else 'Initiative'}' was rejected."
    )
    session.add(notif)
    session.commit()
    
    return participation

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

@router.post("/challenge-participations/{participation_id}/submit-evidence")
def submit_challenge_evidence(participation_id: int,
                              evidence: EvidenceSubmit,
                              session: Session = Depends(get_session),
                              current_user: Employee = Depends(get_current_active_user)):
    participation = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Challenge Participation not found")
    if participation.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this participation")
        
    challenge = session.exec(select(Challenge).where(Challenge.id == participation.challenge_id)).first()
    if APP_SETTINGS["evidence_required"] and challenge.evidence_required and not evidence.proof_url and not evidence.proof_description:
        raise HTTPException(status_code=400, detail="Evidence URL or description is required for this challenge")
        
    participation.proof_url = evidence.proof_url
    participation.proof_description = evidence.proof_description
    participation.approval = ApprovalStatusEnum.Pending
    session.add(participation)
    
    # Claimed Impact
    if evidence.impact_value and evidence.impact_value > 0 and evidence.impact_metric:
        existing_impact = session.exec(
            select(VerifiedImpact)
            .where(VerifiedImpact.participation_type == "Challenge")
            .where(VerifiedImpact.participation_id == participation.id)
        ).first()
        
        if existing_impact:
            existing_impact.impact_value = evidence.impact_value
            existing_impact.impact_metric = evidence.impact_metric
            existing_impact.status = "Pending"
            session.add(existing_impact)
        else:
            impact = VerifiedImpact(
                employee_id=current_user.id,
                participation_type="Challenge",
                participation_id=participation.id,
                activity_title=challenge.title,
                impact_value=evidence.impact_value,
                impact_metric=evidence.impact_metric,
                status="Pending"
            )
            session.add(impact)
            
    session.commit()
    
    notif = Notification(
        employee_id=current_user.id,
        type="Approval",
        message=f"Evidence submitted for Challenge '{challenge.title}'. Awaiting review."
    )
    session.add(notif)
    session.commit()
    return {"message": "Evidence submitted successfully", "status": "Pending"}

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
    
    if APP_SETTINGS["evidence_required"] and challenge.evidence_required and not participation.proof_url and not participation.proof_description:
        raise HTTPException(status_code=400, detail="Proof (URL or description) is required for this challenge")
        
    participation.approval = ApprovalStatusEnum.Approved
    participation.xp_awarded = challenge.xp
    
    participant = session.exec(select(Employee).where(Employee.id == participation.employee_id)).first()
    participant.xp_total += challenge.xp
    
    # Verify associated impact
    impact = session.exec(
        select(VerifiedImpact)
        .where(VerifiedImpact.participation_type == "Challenge")
        .where(VerifiedImpact.participation_id == participation.id)
    ).first()
    if impact:
        impact.status = "Verified"
        session.add(impact)
        
    session.add(participation)
    session.add(participant)
    session.commit()
    
    # Notify user
    notif = Notification(
        employee_id=participant.id,
        type="Approval",
        message=f"Your participation in Challenge '{challenge.title}' was approved! +{challenge.xp} XP earned."
    )
    session.add(notif)
    session.commit()
    
    # Recalculate Department Score
    from routers.environmental import calculate_and_save_department_score
    if participant.dept_id:
        calculate_and_save_department_score(session, participant.dept_id)
        
    # Evaluate badges
    evaluate_badges(session, participant.id)
    
    return participation

@router.post("/challenge-participations/{participation_id}/reject")
def reject_challenge(participation_id: int, 
                     session: Session = Depends(get_session),
                     current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    participation = session.exec(select(ChallengeParticipation).where(ChallengeParticipation.id == participation_id)).first()
    if not participation:
        raise HTTPException(status_code=404, detail="Challenge participation not found")
        
    participation.approval = ApprovalStatusEnum.Rejected
    session.add(participation)
    
    impact = session.exec(
        select(VerifiedImpact)
        .where(VerifiedImpact.participation_type == "Challenge")
        .where(VerifiedImpact.participation_id == participation.id)
    ).first()
    if impact:
        impact.status = "Rejected"
        session.add(impact)
        
    session.commit()
    
    challenge = session.exec(select(Challenge).where(Challenge.id == participation.challenge_id)).first()
    notif = Notification(
        employee_id=participation.employee_id,
        type="Approval",
        message=f"Your participation in Challenge '{challenge.title if challenge else 'Challenge'}' was rejected."
    )
    session.add(notif)
    session.commit()
    
    return participation
