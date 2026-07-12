from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Department, DepartmentScore
from logic import APP_SETTINGS

router = APIRouter(tags=["scores"])

@router.get("/scores/department/{dept_id}")
def get_department_score(dept_id: int, session: Session = Depends(get_session)):
    # For a real system we would calculate this based on underlying metrics.
    # For the hackathon, we fetch the latest stored score and apply weights.
    score = session.exec(
        select(DepartmentScore).where(DepartmentScore.dept_id == dept_id).order_by(DepartmentScore.id.desc())
    ).first()
    
    if not score:
        return {"message": "No score found for department"}
        
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    
    dept_total_score = (score.env_score * w_env) + (score.social_score * w_social) + (score.gov_score * w_gov)
    
    return {
        "dept_id": dept_id,
        "env_score": score.env_score,
        "social_score": score.social_score,
        "gov_score": score.gov_score,
        "weighted_total_score": dept_total_score
    }

@router.get("/scores/departments")
def get_all_department_scores(session: Session = Depends(get_session)):
    departments = session.exec(select(Department)).all()
    results = []
    
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    
    for dept in departments:
        score = session.exec(
            select(DepartmentScore).where(DepartmentScore.dept_id == dept.id).order_by(DepartmentScore.id.desc())
        ).first()
        if score:
            total = (score.env_score * w_env) + (score.social_score * w_social) + (score.gov_score * w_gov)
            results.append({
                "dept_id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "score": round(total, 1)
            })
    return results

@router.get("/scores/overall")
def get_overall_score(session: Session = Depends(get_session)):
    # overall_esg_score = average(all dept_total_scores) — weighted by employee_count
    departments = session.exec(select(Department)).all()
    
    total_weighted_score_sum = 0
    total_env_sum = 0
    total_social_sum = 0
    total_gov_sum = 0
    total_employees = 0
    
    w_env = APP_SETTINGS["w_env"]
    w_social = APP_SETTINGS["w_social"]
    w_gov = APP_SETTINGS["w_gov"]
    
    for dept in departments:
        # Get latest score
        score = session.exec(
            select(DepartmentScore).where(DepartmentScore.dept_id == dept.id).order_by(DepartmentScore.id.desc())
        ).first()
        
        if score:
            dept_total_score = (score.env_score * w_env) + (score.social_score * w_social) + (score.gov_score * w_gov)
            emp_count = dept.employee_count
            total_weighted_score_sum += (dept_total_score * emp_count)
            total_env_sum += (score.env_score * emp_count)
            total_social_sum += (score.social_score * emp_count)
            total_gov_sum += (score.gov_score * emp_count)
            total_employees += emp_count
            
    overall_score = (total_weighted_score_sum / total_employees) if total_employees > 0 else 0
    env_score = (total_env_sum / total_employees) if total_employees > 0 else 0
    social_score = (total_social_sum / total_employees) if total_employees > 0 else 0
    gov_score = (total_gov_sum / total_employees) if total_employees > 0 else 0
    
    return {
        "overall_esg_score": round(overall_score, 1),
        "env_score": round(env_score, 1),
        "social_score": round(social_score, 1),
        "gov_score": round(gov_score, 1),
        "total_employees_factored": total_employees
    }
