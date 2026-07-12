from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Notification, Employee, ComplianceIssue, IssueStatusEnum
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    notifs = session.exec(
        select(Notification)
        .where(Notification.employee_id == current_user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    return notifs

@router.post("/check-overdue")
def check_overdue_issues(session: Session = Depends(get_session)):
    """Simulates a daily cron job that flags overdue issues"""
    issues = session.exec(
        select(ComplianceIssue)
        .where(ComplianceIssue.status == IssueStatusEnum.Open)
        .where(ComplianceIssue.due_date < datetime.utcnow())
    ).all()
    
    count = 0
    for issue in issues:
        msg = f"URGENT: Compliance Issue '{issue.description}' is past its due date!"
        
        # Check if this exact notification already exists
        existing = session.exec(
            select(Notification)
            .where(Notification.employee_id == issue.owner_id)
            .where(Notification.type == "Compliance")
            .where(Notification.message == msg)
        ).first()
        
        if not existing:
            notif = Notification(
                employee_id=issue.owner_id,
                type="Compliance",
                message=msg
            )
            session.add(notif)
            count += 1
        
    session.commit()
    return {"message": f"Checked issues. Generated {count} new overdue notifications."}

@router.delete("/")
def clear_all_notifications(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    notifs = session.exec(
        select(Notification)
        .where(Notification.employee_id == current_user.id)
    ).all()
    for notif in notifs:
        session.delete(notif)
    session.commit()
    return {"message": "All notifications cleared"}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    notif = session.exec(
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.employee_id == current_user.id)
    ).first()
    if notif:
        session.delete(notif)
        session.commit()
        return {"message": "Notification deleted"}
    return {"message": "Notification not found"}
