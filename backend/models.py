from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

# Enums
class RoleEnum(str, Enum):
    Admin = "Admin"
    DeptHead = "DeptHead"
    Employee = "Employee"
    Auditor = "Auditor"

class StatusEnum(str, Enum):
    Active = "Active"
    Inactive = "Inactive"

class CategoryTypeEnum(str, Enum):
    CSR_Activity = "CSR_Activity"
    Challenge = "Challenge"

class SourceTypeEnum(str, Enum):
    Purchase = "Purchase"
    Manufacturing = "Manufacturing"
    Expense = "Expense"
    Fleet = "Fleet"

class ApprovalStatusEnum(str, Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"

class ChallengeStatusEnum(str, Enum):
    Draft = "Draft"
    Active = "Active"
    Under_Review = "Under_Review"
    Completed = "Completed"
    Archived = "Archived"

class SeverityEnum(str, Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

class IssueStatusEnum(str, Enum):
    Open = "Open"
    In_Progress = "In_Progress"
    Resolved = "Resolved"


# Master Data Models

class Department(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    code: str = Field(unique=True, index=True)
    head_id: Optional[int] = Field(default=None, foreign_key="employee.id")
    parent_dept_id: Optional[int] = Field(default=None, foreign_key="department.id")
    employee_count: int = Field(default=0)
    status: StatusEnum = Field(default=StatusEnum.Active)

    # Note: To avoid circular dependencies in initialization, we'll define relationships carefully or rely on IDs.
    employees: List["Employee"] = Relationship(back_populates="department", sa_relationship_kwargs={"foreign_keys": "Employee.dept_id"})

class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    dept_id: Optional[int] = Field(default=None, foreign_key="department.id")
    role: RoleEnum = Field(default=RoleEnum.Employee)
    xp_total: int = Field(default=0)
    points_balance: int = Field(default=0)
    status: StatusEnum = Field(default=StatusEnum.Active)
    phone: Optional[str] = Field(default="")
    bio: Optional[str] = Field(default="")

    department: Optional[Department] = Relationship(back_populates="employees", sa_relationship_kwargs={"foreign_keys": "[Employee.dept_id]"})

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: CategoryTypeEnum
    status: StatusEnum = Field(default=StatusEnum.Active)

class EmissionFactor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    activity_type: str
    unit: str
    co2e_per_unit: float
    status: StatusEnum = Field(default=StatusEnum.Active)

class EnvironmentalGoal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    target_metric: str
    target_value: float
    current_value: float = Field(default=0.0)
    deadline: datetime
    dept_id: Optional[int] = Field(default=None, foreign_key="department.id")

class ESGPolicy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    body: str
    effective_date: datetime
    status: StatusEnum = Field(default=StatusEnum.Active)

class Badge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    unlock_rule_json: str  # Store as JSON string, e.g., '{"metric": "xp_total", "operator": ">=", "value": 100}'
    icon: str

class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    points_required: int
    stock: int
    status: StatusEnum = Field(default=StatusEnum.Active)

class ProductESGProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    carbon_footprint_per_unit: float
    sustainability_rating: str
    status: StatusEnum = Field(default=StatusEnum.Active)

# Transactional Data Models

class CarbonTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dept_id: int = Field(foreign_key="department.id")
    source_type: SourceTypeEnum
    source_ref_id: str
    quantity: float
    emission_factor_id: int = Field(foreign_key="emissionfactor.id")
    co2e_calculated: float
    date: datetime = Field(default_factory=datetime.utcnow)
    auto_calculated: bool = Field(default=False)

class CSRActivity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category_id: int = Field(foreign_key="category.id")
    points_value: int
    evidence_required: bool = Field(default=False)
    description: str

class EmployeeParticipation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    activity_id: int = Field(foreign_key="csractivity.id")
    proof_url: Optional[str] = Field(default=None)
    approval_status: ApprovalStatusEnum = Field(default=ApprovalStatusEnum.Pending)
    points_earned: int = Field(default=0)
    completion_date: Optional[datetime] = Field(default=None)

class Challenge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category_id: int = Field(foreign_key="category.id")
    description: str
    xp: int
    difficulty: str
    evidence_required: bool = Field(default=False)
    deadline: datetime
    status: ChallengeStatusEnum = Field(default=ChallengeStatusEnum.Draft)

class ChallengeParticipation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    challenge_id: int = Field(foreign_key="challenge.id")
    employee_id: int = Field(foreign_key="employee.id")
    progress: float = Field(default=0.0)
    proof_url: Optional[str] = Field(default=None)
    approval: ApprovalStatusEnum = Field(default=ApprovalStatusEnum.Pending)
    xp_awarded: int = Field(default=0)

class PolicyAcknowledgement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    policy_id: int = Field(foreign_key="esgpolicy.id")
    employee_id: int = Field(foreign_key="employee.id")
    acknowledged_at: datetime = Field(default_factory=datetime.utcnow)

class Audit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dept_id: int = Field(foreign_key="department.id")
    scope: str
    date_range_start: datetime
    date_range_end: datetime
    status: IssueStatusEnum = Field(default=IssueStatusEnum.Open)

class ComplianceIssue(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    audit_id: int = Field(foreign_key="audit.id")
    severity: SeverityEnum
    description: str
    owner_id: int = Field(foreign_key="employee.id")
    due_date: datetime
    status: IssueStatusEnum = Field(default=IssueStatusEnum.Open)

class DepartmentScore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dept_id: int = Field(foreign_key="department.id")
    env_score: float
    social_score: float
    gov_score: float
    total_score: float
    period: str # e.g., '2026-Q3'

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    type: str # e.g., 'BadgeUnlock', 'Approval', 'Compliance'
    message: str
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RewardRedemption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    reward_id: int = Field(foreign_key="reward.id")
    points_spent: int
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)

class EmployeeBadge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    badge_id: int = Field(foreign_key="badge.id")
    awarded_at: datetime = Field(default_factory=datetime.utcnow)
