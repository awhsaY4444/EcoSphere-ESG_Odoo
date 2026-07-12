from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlmodel import Session, select
from database import get_session
from models import (
    DepartmentScore, Department, CarbonTransaction, EmployeeParticipation, 
    ApprovalStatusEnum, ComplianceIssue, IssueStatusEnum, Employee
)
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export")
def export_csv(dept_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(DepartmentScore)
    if dept_id:
        query = query.where(DepartmentScore.dept_id == dept_id)
        
    scores = session.exec(query).all()
    
    csv_lines = ["Department ID,Department Name,Period,Env Score,Social Score,Gov Score,Total Score"]
    for s in scores:
        dept = session.exec(select(Department).where(Department.id == s.dept_id)).first()
        dept_name = dept.name if dept else "Unknown"
        csv_lines.append(f"{s.dept_id},{dept_name},{s.period},{s.env_score},{s.social_score},{s.gov_score},{s.total_score}")
        
    csv_content = "\n".join(csv_lines)
    return PlainTextResponse(content=csv_content, media_type="text/csv")

@router.get("/summary")
def get_report_summary(dept_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, session: Session = Depends(get_session)):
    # 1. Total Carbon Avoided / Emitted dynamically from CarbonTransaction
    tx_query = select(CarbonTransaction)
    if dept_id:
        tx_query = tx_query.where(CarbonTransaction.dept_id == dept_id)
        
    if start_date:
        try:
            tx_query = tx_query.where(CarbonTransaction.date >= datetime.strptime(start_date, "%Y-%m-%d"))
        except:
            pass
    if end_date:
        try:
            tx_query = tx_query.where(CarbonTransaction.date <= datetime.strptime(end_date, "%Y-%m-%d"))
        except:
            pass
            
    txs = session.exec(tx_query).all()
    total_emitted = sum(t.co2e_calculated for t in txs)
    
    # 2. CSR participation dynamically from EmployeeParticipation
    social_query = select(EmployeeParticipation).where(EmployeeParticipation.approval_status == ApprovalStatusEnum.Approved)
    if dept_id:
        social_query = social_query.join(Employee).where(Employee.dept_id == dept_id)
        
    if start_date:
        try:
            social_query = social_query.where(EmployeeParticipation.completion_date >= datetime.strptime(start_date, "%Y-%m-%d"))
        except:
            pass
    if end_date:
        try:
            social_query = social_query.where(EmployeeParticipation.completion_date <= datetime.strptime(end_date, "%Y-%m-%d"))
        except:
            pass
            
    participations = session.exec(social_query).all()
    social_count = len(participations)
    
    # Calculate workforce percentage
    emp_query = select(Employee)
    if dept_id:
        emp_query = emp_query.where(Employee.dept_id == dept_id)
    total_employees = len(session.exec(emp_query).all())
    
    unique_participants = len(set(p.employee_id for p in participations))
    workforce_pct = int((unique_participants / total_employees * 100)) if total_employees > 0 else 0

    # 3. Compliance rating dynamically from ComplianceIssue
    gov_query = select(ComplianceIssue)
    if dept_id:
        from models import Audit
        gov_query = gov_query.join(Audit).where(Audit.dept_id == dept_id)
        
    issues = session.exec(gov_query).all()
    resolved_count = sum(1 for i in issues if i.status == IssueStatusEnum.Resolved)
    total_issues = len(issues)
    compliance_score = int((resolved_count / total_issues * 100)) if total_issues > 0 else 100

    return {
        "total_carbon": f"{int(total_emitted):,} kg CO2e",
        "csr_participation": f"{workforce_pct}% Workforce ({social_count} Approved)",
        "compliance_score": f"{compliance_score}/100 ({resolved_count}/{total_issues} Resolved)"
    }
