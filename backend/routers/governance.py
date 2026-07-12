from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Employee, ComplianceIssue, IssueStatusEnum, Audit, Department
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(tags=["governance"])

@router.get("/audits")
def get_audits(session: Session = Depends(get_session)):
    audits = session.exec(select(Audit)).all()
    results = []
    for a in audits:
        dept = session.exec(select(Department).where(Department.id == a.dept_id)).first()
        dept_name = dept.name if dept else "Unknown"
        results.append({
            "id": a.id,
            "title": a.scope,
            "dept": dept_name,
            "auditor": "System Auditor",
            "date": a.date_range_start.strftime("%Y-%m-%d"),
            "findings": "See details",
            "status": a.status,
            "statusColor": "border-blue-500 text-blue-500" if a.status == "Resolved" else "border-purple-500 text-purple-500"
        })
    return results

@router.get("/issues")
def get_issues(session: Session = Depends(get_session)):
    issues = session.exec(select(ComplianceIssue)).all()
    results = []
    for i in issues:
        audit = session.exec(select(Audit).where(Audit.id == i.audit_id)).first()
        dept_name = "Unknown"
        if audit:
            dept = session.exec(select(Department).where(Department.id == audit.dept_id)).first()
            if dept:
                dept_name = dept.name
        
        results.append({
            "id": i.id,
            "issue": i.description,
            "severity": i.severity,
            "dept": dept_name,
            "status": i.status,
            "statusColor": "border-green-500 text-green-500" if i.status == "Resolved" else "border-red-500 text-red-500"
        })
    return results

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

@router.post("/audits")
def create_audit(audit: dict, session: Session = Depends(get_session)):
    from models import Audit
    new_audit = Audit(
        scope=audit.get("scope"),
        dept_id=audit.get("dept_id"),
        status="Planned",
        date_range_start=datetime.strptime(audit.get("date_start"), "%Y-%m-%d"),
        date_range_end=datetime.strptime(audit.get("date_end"), "%Y-%m-%d")
    )
    session.add(new_audit)
    session.commit()
    session.refresh(new_audit)
    return new_audit

@router.post("/issues/{issue_id}/resolve")
def resolve_issue(issue_id: int, session: Session = Depends(get_session)):
    from models import ComplianceIssue, IssueStatusEnum
    issue = session.exec(select(ComplianceIssue).where(ComplianceIssue.id == issue_id)).first()
    if not issue:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = IssueStatusEnum.Resolved
    session.add(issue)
    session.commit()
    return {"ok": True}
