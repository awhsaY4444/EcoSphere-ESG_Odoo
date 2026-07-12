from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Department, Category, EmissionFactor, Employee, RoleEnum, Badge, Reward
from auth import get_current_active_user, require_role

router = APIRouter(tags=["master_data"])

# Departments
@router.get("/departments", response_model=List[Department])
def get_departments(session: Session = Depends(get_session)):
    return session.exec(select(Department)).all()

@router.post("/departments", response_model=Department)
def create_department(dept: Department, session: Session = Depends(get_session), 
                      current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    session.add(dept)
    session.commit()
    session.refresh(dept)
    return dept

# Categories
@router.get("/categories", response_model=List[Category])
def get_categories(session: Session = Depends(get_session)):
    return session.exec(select(Category)).all()

@router.post("/categories", response_model=Category)
def create_category(cat: Category, session: Session = Depends(get_session),
                    current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat

# Emission Factors
@router.get("/emission-factors", response_model=List[EmissionFactor])
def get_emission_factors(session: Session = Depends(get_session)):
    return session.exec(select(EmissionFactor)).all()

@router.post("/emission-factors", response_model=EmissionFactor)
def create_emission_factor(ef: EmissionFactor, session: Session = Depends(get_session),
                           current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    session.add(ef)
    session.commit()
    session.refresh(ef)
    return ef

# Badges
@router.get("/badges", response_model=List[Badge])
def get_badges(session: Session = Depends(get_session)):
    return session.exec(select(Badge)).all()

# Rewards
@router.get("/rewards", response_model=List[Reward])
def get_rewards(session: Session = Depends(get_session)):
    return session.exec(select(Reward)).all()

# Products
@router.get("/products")
def get_products(session: Session = Depends(get_session)):
    from models import ProductESGProfile
    return session.exec(select(ProductESGProfile)).all()

@router.post("/products")
def create_product(product: dict, session: Session = Depends(get_session),
                   current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    from models import ProductESGProfile
    new_product = ProductESGProfile(**product)
    session.add(new_product)
    session.commit()
    session.refresh(new_product)
    return new_product
