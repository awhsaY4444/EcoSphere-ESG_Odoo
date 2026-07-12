from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import (
    Employee, ComplianceIssue, IssueStatusEnum, Audit, Department, 
    ESGPolicy, PolicyAcknowledgement, RoleEnum, Notification
)
from auth import get_current_active_user, require_role
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(tags=["governance"])

class PolicyCreate(BaseModel):
    title: str
    body: str

@router.get("/audits")
def get_audits(session: Session = Depends(get_session)):
    audits = session.exec(select(Audit)).all()
    results = []
    for a in audits:
        dept = session.exec(select(Department).where(Department.id == a.dept_id)).first()
        dept_name = dept.name if dept else "Global Scope"
        results.append({
            "id": a.id,
            "title": a.scope,
            "dept": dept_name,
            "auditor": "External Auditor",
            "date": a.date_range_start.strftime("%Y-%m-%d"),
            "findings": "Compliance review successfully executed.",
            "status": a.status,
            "statusColor": "border-green-500 text-green-500" if a.status == IssueStatusEnum.Resolved else "border-purple-500 text-purple-500"
        })
    return results

@router.get("/issues")
def get_issues(session: Session = Depends(get_session)):
    issues = session.exec(select(ComplianceIssue)).all()
    results = []
    for i in issues:
        audit = session.exec(select(Audit).where(Audit.id == i.audit_id)).first()
        dept_name = "Global Scope"
        if audit:
            dept = session.exec(select(Department).where(Department.id == audit.dept_id)).first()
            if dept:
                dept_name = dept.name
        
        # Determine overdue status at runtime
        is_overdue = i.status != IssueStatusEnum.Resolved and i.due_date < datetime.utcnow()
        
        results.append({
            "id": i.id,
            "issue": i.description,
            "severity": i.severity,
            "dept": dept_name,
            "due_date": i.due_date.strftime("%Y-%m-%d"),
            "is_overdue": is_overdue,
            "status": i.status,
            "statusColor": "border-green-500 text-green-500" if i.status == IssueStatusEnum.Resolved else "border-red-500 text-red-500"
        })
    return results

@router.get("/compliance-issues", response_model=List[ComplianceIssue])
def get_compliance_issues(session: Session = Depends(get_session)):
    return session.exec(select(ComplianceIssue)).all()

@router.get("/compliance-issues/overdue", response_model=List[ComplianceIssue])
def get_overdue_issues(session: Session = Depends(get_session)):
    now = datetime.utcnow()
    issues = session.exec(
        select(ComplianceIssue)
        .where(ComplianceIssue.status != IssueStatusEnum.Resolved)
        .where(ComplianceIssue.due_date < now)
    ).all()
    return issues

@router.post("/audits")
def create_audit(audit_data: dict, session: Session = Depends(get_session),
                 current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.Auditor]))):
    new_audit = Audit(
        scope=audit_data.get("scope", "General Review"),
        dept_id=audit_data.get("dept_id") or 1,
        status=IssueStatusEnum.Open,
        date_range_start=datetime.strptime(audit_data.get("date_start", datetime.utcnow().strftime("%Y-%m-%d")), "%Y-%m-%d"),
        date_range_end=datetime.strptime(audit_data.get("date_end", datetime.utcnow().strftime("%Y-%m-%d")), "%Y-%m-%d")
    )
    session.add(new_audit)
    session.commit()
    session.refresh(new_audit)
    return new_audit

@router.post("/issues/{issue_id}/resolve")
def resolve_issue(issue_id: int, session: Session = Depends(get_session),
                  current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.Auditor, RoleEnum.DeptHead]))):
    issue = session.exec(select(ComplianceIssue).where(ComplianceIssue.id == issue_id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = IssueStatusEnum.Resolved
    session.add(issue)
    session.commit()
    
    # Recalculate Department Score since issue is resolved
    from routers.environmental import calculate_and_save_department_score
    # Find employee's department or audit department
    audit = session.exec(select(Audit).where(Audit.id == issue.audit_id)).first()
    if audit and audit.dept_id:
        calculate_and_save_department_score(session, audit.dept_id)
        
    return {"ok": True}

# Policies Endpoints
@router.get("/policies")
def get_policies(session: Session = Depends(get_session), current_user: Employee = Depends(get_current_active_user)):
    policies = session.exec(select(ESGPolicy)).all()
    acknowledged_ids = {pa.policy_id for pa in session.exec(
        select(PolicyAcknowledgement).where(PolicyAcknowledgement.employee_id == current_user.id)
    ).all()}
    
    results = []
    for p in policies:
        results.append({
            "id": p.id,
            "title": p.title,
            "body": p.body,
            "effective_date": p.effective_date.strftime("%d %b %Y"),
            "status": p.status,
            "acknowledged": p.id in acknowledged_ids
        })
    return results

@router.post("/policies")
def create_policy(policy_data: PolicyCreate, session: Session = Depends(get_session),
                  current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    policy = ESGPolicy(
        title=policy_data.title,
        body=policy_data.body,
        effective_date=datetime.utcnow()
    )
    session.add(policy)
    session.commit()
    session.refresh(policy)
    return policy

@router.post("/policies/{policy_id}/acknowledge")
def acknowledge_policy(policy_id: int, session: Session = Depends(get_session),
                       current_user: Employee = Depends(get_current_active_user)):
    policy = session.exec(select(ESGPolicy).where(ESGPolicy.id == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    existing = session.exec(
        select(PolicyAcknowledgement)
        .where(PolicyAcknowledgement.policy_id == policy_id)
        .where(PolicyAcknowledgement.employee_id == current_user.id)
    ).first()
    
    if existing:
        return {"message": "Already acknowledged"}
        
    ack = PolicyAcknowledgement(
        policy_id=policy_id,
        employee_id=current_user.id,
        acknowledged_at=datetime.utcnow()
    )
    session.add(ack)
    session.commit()
    return {"message": "Policy acknowledged successfully"}

@router.get("/policies/acknowledgements")
def get_acknowledgement_tracking(session: Session = Depends(get_session),
                                 current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    employees = session.exec(select(Employee)).all()
    policies = session.exec(select(ESGPolicy)).all()
    
    results = []
    for emp in employees:
        dept = session.exec(select(Department).where(Department.id == emp.dept_id)).first()
        dept_name = dept.name if dept else "N/A"
        
        # Find which policies this employee has acknowledged
        acks = session.exec(
            select(PolicyAcknowledgement).where(PolicyAcknowledgement.employee_id == emp.id)
        ).all()
        acked_policy_ids = {a.policy_id for a in acks}
        
        pending_policies = [p.title for p in policies if p.id not in acked_policy_ids]
        
        results.append({
            "employee_id": emp.id,
            "employee": emp.name,
            "department": dept_name,
            "pending_count": len(pending_policies),
            "pending_policies": pending_policies
        })
    return results

@router.post("/employees/{employee_id}/remind-policies")
def remind_employee_policies(employee_id: int, session: Session = Depends(get_session),
                             current_user: Employee = Depends(require_role([RoleEnum.Admin, RoleEnum.DeptHead]))):
    emp = session.exec(select(Employee).where(Employee.id == employee_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    policies = session.exec(select(ESGPolicy)).all()
    acks = session.exec(
        select(PolicyAcknowledgement).where(PolicyAcknowledgement.employee_id == employee_id)
    ).all()
    acked_policy_ids = {a.policy_id for a in acks}
    
    pending_policies = [p.title for p in policies if p.id not in acked_policy_ids]
    if len(pending_policies) == 0:
        return {"message": "Employee has acknowledged all policies"}
        
    # Send a notification
    msg = f"Reminder: Please sign off on the pending policies: {', '.join(pending_policies)}."
    notif = Notification(
        employee_id=employee_id,
        type="Compliance",
        message=msg
    )
    session.add(notif)
    session.commit()
    return {"message": f"Reminder sent to {emp.name}"}
