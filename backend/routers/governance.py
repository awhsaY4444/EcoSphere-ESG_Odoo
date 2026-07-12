from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Employee, ComplianceIssue, IssueStatusEnum
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(tags=["governance"])

@router.get("/compliance-issues", response_model=List[ComplianceIssue])
def get_compliance_issues(session: Session = Depends(get_session)):
    return session.exec(select(ComplianceIssue)).all()

@router.get("/compliance-issues/overdue", response_model=List[ComplianceIssue])
def get_overdue_issues(session: Session = Depends(get_session)):
    # Compute at query time: status='Open' AND due_date < today()
    now = datetime.utcnow()
    issues = session.exec(
        select(ComplianceIssue)
        .where(ComplianceIssue.status == IssueStatusEnum.Open)
        .where(ComplianceIssue.due_date < now)
    ).all()
    return issues
