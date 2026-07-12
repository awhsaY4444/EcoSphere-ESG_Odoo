from sqlmodel import Session, select
from models import Employee, Badge, EmployeeBadge, Notification, Department, DepartmentScore, CarbonTransaction
import json

def evaluate_badges(session: Session, employee_id: int):
    """
    Evaluates all badges against the employee's stats.
    If a rule is met and the employee doesn't have the badge, award it and create a notification.
    """
    employee = session.exec(select(Employee).where(Employee.id == employee_id)).first()
    if not employee:
        return

    all_badges = session.exec(select(Badge)).all()
    awarded_badges = session.exec(select(EmployeeBadge).where(EmployeeBadge.employee_id == employee_id)).all()
    awarded_badge_ids = {b.badge_id for b in awarded_badges}

    for badge in all_badges:
        if badge.id in awarded_badge_ids:
            continue
        
        try:
            rule = json.loads(badge.unlock_rule_json)
            metric = rule.get("metric")
            operator = rule.get("operator")
            target_value = rule.get("value")
            
            current_value = 0
            if metric == "xp_total":
                current_value = employee.xp_total
            elif metric == "points_balance":
                current_value = employee.points_balance
            elif metric == "completed_challenges":
                # Calculate completed challenges dynamically if not stored on Employee
                from models import ChallengeParticipation, ApprovalStatusEnum
                participations = session.exec(
                    select(ChallengeParticipation)
                    .where(ChallengeParticipation.employee_id == employee.id)
                    .where(ChallengeParticipation.approval == ApprovalStatusEnum.Approved)
                ).all()
                current_value = len(participations)
            
            # Evaluate rule
            is_met = False
            if operator == ">=":
                is_met = current_value >= target_value
            elif operator == ">":
                is_met = current_value > target_value
            elif operator == "==":
                is_met = current_value == target_value
            elif operator == "<=":
                is_met = current_value <= target_value
                
            if is_met:
                new_award = EmployeeBadge(employee_id=employee.id, badge_id=badge.id)
                session.add(new_award)
                
                notif = Notification(
                    employee_id=employee.id,
                    type="BadgeUnlock",
                    message=f"Congratulations! You unlocked the '{badge.name}' badge!"
                )
                session.add(notif)
                session.commit()
                
        except Exception as e:
            print(f"Error evaluating badge {badge.id}: {e}")
            pass

# Setting overrides (for hackathon simulation)
APP_SETTINGS = {
    "auto_emission_calc": True,
    "evidence_required": True,
    "w_env": 0.4,
    "w_social": 0.3,
    "w_gov": 0.3
}
