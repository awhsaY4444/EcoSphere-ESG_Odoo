from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import (
    Department, Employee, Category, EmissionFactor, EnvironmentalGoal, ESGPolicy,
    Badge, Reward, CarbonTransaction, CSRActivity, EmployeeParticipation, Challenge,
    ChallengeParticipation, PolicyAcknowledgement, Audit, ComplianceIssue, DepartmentScore,
    Notification, RewardRedemption, RoleEnum, CategoryTypeEnum, SourceTypeEnum,
    ApprovalStatusEnum, ChallengeStatusEnum, SeverityEnum, IssueStatusEnum, ProductESGProfile
)
from passlib.context import CryptContext
from datetime import datetime, timedelta
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Check if already seeded
        if session.exec(select(Department)).first():
            print("Database already seeded.")
            return

        print("Seeding database...")
        # Departments
        hq = Department(name="Global HQ", code="GHQ", employee_count=5)
        it = Department(name="Information Technology", code="IT", employee_count=3)
        ops = Department(name="Operations", code="OPS", employee_count=4)
        hr = Department(name="Human Resources", code="HR", employee_count=2)
        session.add_all([hq, it, ops, hr])
        session.commit()
        session.refresh(hq)
        session.refresh(it)
        session.refresh(ops)

        # Employees
        admin = Employee(
            name="Admin User", email="admin@eco.com", password_hash=get_password_hash("admin123"),
            role=RoleEnum.Admin, dept_id=hq.id,
            bio="Platform administrator and ESG program lead. Oversees all sustainability initiatives, department score targets, and governance compliance across the organization."
        )
        hr_head = Employee(
            name="HR Head", email="hrhead@eco.com", password_hash=get_password_hash("hr123"),
            role=RoleEnum.DeptHead, dept_id=hr.id,
            bio="Head of Human Resources with a focus on building an inclusive, diverse, and sustainability-conscious workplace. Champions employee well-being programs and drives CSR participation across all departments."
        )
        it_head = Employee(
            name="IT Head", email="ithead@eco.com", password_hash=get_password_hash("it123"),
            role=RoleEnum.DeptHead, dept_id=it.id,
            bio="Technology leader committed to green IT practices. Working to reduce the digital carbon footprint by optimizing server energy usage, promoting remote collaboration, and deploying energy-efficient hardware across the IT department."
        )
        auditor = Employee(
            name="Global Auditor", email="audit@eco.com", password_hash=get_password_hash("audit123"),
            role=RoleEnum.Auditor, dept_id=hq.id,
            bio="Independent governance auditor responsible for ensuring organizational compliance with ESG policies. Conducts quarterly reviews and raises compliance issues to ensure accountability at every level of the company."
        )
        emp1 = Employee(
            name="Alice Smith", email="alice@eco.com", password_hash=get_password_hash("emp123"),
            dept_id=it.id, xp_total=50, points_balance=100,
            bio="Software engineer and passionate sustainability advocate. Active participant in zero-waste and energy-saving challenges. Believes technology can be a powerful force for positive environmental change."
        )
        emp2 = Employee(
            name="Bob Jones", email="bob@eco.com", password_hash=get_password_hash("emp123"),
            dept_id=ops.id,
            bio="Operations specialist focused on supply chain efficiency and reducing fleet emissions. Exploring ways to optimize logistics routes to cut diesel consumption and lower the department's carbon footprint."
        )
        emp3 = Employee(
            name="Charlie Brown", email="charlie@eco.com", password_hash=get_password_hash("emp123"),
            dept_id=ops.id,
            bio="Facilities coordinator with a passion for waste reduction. Champions recycling programs on-site and is working towards the Zero Waste Lunch challenge. Believes small daily habits create the biggest long-term impact."
        )
        session.add_all([admin, hr_head, it_head, auditor, emp1, emp2, emp3])
        session.commit()
        session.refresh(emp1)
        session.refresh(admin)

        # Categories
        cat_energy = Category(name="Energy Saving", type=CategoryTypeEnum.Challenge)
        cat_community = Category(name="Community Volunteering", type=CategoryTypeEnum.CSR_Activity)
        cat_waste = Category(name="Waste Reduction", type=CategoryTypeEnum.Challenge)
        session.add_all([cat_energy, cat_community, cat_waste])
        session.commit()
        session.refresh(cat_energy)
        session.refresh(cat_community)

        # Emission Factors
        ef_elec = EmissionFactor(activity_type="Grid Electricity", unit="kWh", co2e_per_unit=0.4)
        ef_diesel = EmissionFactor(activity_type="Diesel Fuel", unit="liter", co2e_per_unit=2.68)
        ef_flight = EmissionFactor(activity_type="Short-haul Flight", unit="km", co2e_per_unit=0.15)
        ef_paper = EmissionFactor(activity_type="Paper Used", unit="kg", co2e_per_unit=0.9)
        session.add_all([ef_elec, ef_diesel, ef_flight, ef_paper])
        session.commit()

        # Badges
        badge_novice = Badge(name="Eco Novice", description="Earned 100 XP", unlock_rule_json=json.dumps({"metric": "xp_total", "operator": ">=", "value": 100}), icon="leaf")
        badge_master = Badge(name="Eco Master", description="Completed 3 challenges", unlock_rule_json=json.dumps({"metric": "completed_challenges", "operator": ">=", "value": 3}), icon="tree")
        badge_wealthy = Badge(name="Points Hoarder", description="Accumulate 500 points", unlock_rule_json=json.dumps({"metric": "points_balance", "operator": ">=", "value": 500}), icon="coins")
        
        # Seed Badges
        b1 = Badge(name="Green Beginner", description="Join your first CSR activity", unlock_rule_json='{"metric": "completed_challenges", "operator": ">=", "value": 1}', icon="🌱")
        
        # Seed Products
        p1 = ProductESGProfile(name="Eco-Friendly Notebook", carbon_footprint_per_unit=2.5, sustainability_rating="A")
        
        session.add_all([badge_novice, badge_master, badge_wealthy, b1, p1])
        session.commit()

        # Rewards
        reward_mug = Reward(name="Eco-Friendly Mug", description="Reusable coffee mug", points_required=50, stock=20)
        reward_dayoff = Reward(name="Half-day Off", description="Take a half-day off on Friday", points_required=500, stock=5)
        session.add_all([reward_mug, reward_dayoff])
        session.commit()

        # Challenges
        ch1 = Challenge(title="Bike to Work Week", category_id=cat_energy.id, description="Bike to work for 5 days", xp=100, difficulty="Medium", evidence_required=True, deadline=datetime.utcnow() + timedelta(days=7), status=ChallengeStatusEnum.Active)
        ch2 = Challenge(title="Zero Waste Lunch", category_id=cat_waste.id, description="Bring a zero waste lunch", xp=20, difficulty="Easy", evidence_required=False, deadline=datetime.utcnow() + timedelta(days=2), status=ChallengeStatusEnum.Draft)
        session.add_all([ch1, ch2])
        session.commit()

        # Audits & Compliance
        audit1 = Audit(dept_id=ops.id, scope="Q3 Operations Review", date_range_start=datetime.utcnow()-timedelta(days=60), date_range_end=datetime.utcnow(), status=IssueStatusEnum.Open)
        session.add(audit1)
        session.commit()
        session.refresh(audit1)
        
        issue1 = ComplianceIssue(audit_id=audit1.id, severity=SeverityEnum.High, description="Improper waste disposal documented in site B.", owner_id=admin.id, due_date=datetime.utcnow()-timedelta(days=2), status=IssueStatusEnum.Open)
        issue2 = ComplianceIssue(audit_id=audit1.id, severity=SeverityEnum.Medium, description="Missing safety training logs.", owner_id=emp2.id, due_date=datetime.utcnow()+timedelta(days=10), status=IssueStatusEnum.In_Progress)
        session.add_all([issue1, issue2])
        
        session.commit()
        print("Database seeded successfully.")

if __name__ == "__main__":
    seed_data()
