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

@router.put("/emission-factors/{ef_id}", response_model=EmissionFactor)
def update_emission_factor(ef_id: int, ef_data: dict, session: Session = Depends(get_session),
                           current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == ef_id)).first()
    if not ef:
        raise HTTPException(status_code=404, detail="Emission Factor not found")
        
    if "activity_type" in ef_data:
        ef.activity_type = ef_data["activity_type"]
    if "unit" in ef_data:
        ef.unit = ef_data["unit"]
    if "co2e_per_unit" in ef_data:
        ef.co2e_per_unit = float(ef_data["co2e_per_unit"])
    if "status" in ef_data:
        ef.status = ef_data["status"]
        
    session.add(ef)
    session.commit()
    session.refresh(ef)
    return ef

@router.delete("/emission-factors/{ef_id}")
def delete_emission_factor(ef_id: int, session: Session = Depends(get_session),
                           current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == ef_id)).first()
    if not ef:
        raise HTTPException(status_code=404, detail="Emission Factor not found")
        
    session.delete(ef)
    session.commit()
    return {"ok": True}

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
<<<<<<< HEAD
=======

@router.put("/products/{product_id}")
def update_product(product_id: int, product_data: dict, session: Session = Depends(get_session),
                   current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    from models import ProductESGProfile
    product = session.exec(select(ProductESGProfile).where(ProductESGProfile.id == product_id)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if "name" in product_data:
        product.name = product_data["name"]
    if "carbon_footprint_per_unit" in product_data:
        product.carbon_footprint_per_unit = float(product_data["carbon_footprint_per_unit"])
    if "sustainability_rating" in product_data:
        product.sustainability_rating = product_data["sustainability_rating"]
    if "status" in product_data:
        product.status = product_data["status"]
        
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, session: Session = Depends(get_session),
                   current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    from models import ProductESGProfile
    product = session.exec(select(ProductESGProfile).where(ProductESGProfile.id == product_id)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    session.delete(product)
    session.commit()
    return {"ok": True}
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
