from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database import get_session
from models import Employee, RoleEnum
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
from datetime import timedelta
from pydantic import BaseModel
from typing import Optional
import requests
import random

router = APIRouter(prefix="/auth", tags=["auth"])

# Pool of unique starter bios assigned to new members on registration
NEW_MEMBER_BIOS = [
    "New to the EcoSphere platform and excited to begin my sustainability journey. Looking forward to participating in challenges and making a measurable difference for our planet.",
    "Passionate about making workplaces greener. Eager to contribute to CSR initiatives, reduce my carbon footprint, and collaborate with like-minded colleagues on meaningful sustainability goals.",
    "Joined EcoSphere to turn good environmental intentions into tracked, verified actions. Ready to take on challenges, earn badges, and be part of a company that truly cares about the future.",
    "Sustainability enthusiast and firm believer that every small action counts. Excited to use EcoSphere to discover how my daily choices at work impact our collective ESG score.",
    "Committed to learning more about ESG and putting that knowledge into practice. Excited to start with energy-saving challenges and grow into a recognized sustainability champion here.",
    "I believe businesses have a responsibility to lead on climate. Joining EcoSphere is my first step toward holding myself accountable and contributing to our organization's net-zero ambitions.",
    "New member, big goals. Here to engage with the community, complete sustainability challenges, and help push our governance and social scores to new heights.",
    "Environmentally conscious and eager to prove it through action, not just words. Looking forward to tracking my personal impact, engaging with CSR activities, and earning my first badge.",
    "Excited to join a team that takes ESG seriously. Ready to contribute to our shared sustainability mission through active participation in challenges and community volunteering.",
    "A strong advocate for transparent, data-driven sustainability reporting. Joining EcoSphere to stay informed, stay accountable, and inspire others around me to do the same.",
]

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

class GoogleAuthRequest(BaseModel):
    token: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    role: str
    dept_id: Optional[int]
    department: str
    phone: str
    bio: str

class EmployeeSignup(BaseModel):
    name: str
    email: str
    password: str
    dept_id: int

@router.post("/signup", response_model=Token)
def signup(user_data: EmployeeSignup, session: Session = Depends(get_session)):
    # Check if user already exists
    existing = session.exec(select(Employee).where(Employee.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    auto_bio = random.choice(NEW_MEMBER_BIOS)
    # New signups are forced to be RoleEnum.Employee
    new_user = Employee(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role=RoleEnum.Employee,
        dept_id=user_data.dept_id,
        bio=auto_bio
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role, "user_id": new_user.id}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(Employee).where(Employee.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id}

@router.post("/google", response_model=Token)
def google_login(request: GoogleAuthRequest, session: Session = Depends(get_session)):
    google_verify_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.token}"
    response = requests.get(google_verify_url)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")
        
    user_info = response.json()
    email = user_info.get("email")
    name = user_info.get("name")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    user = session.exec(select(Employee).where(Employee.email == email)).first()
    
    if not user:
        user = Employee(
            name=name,
            email=email,
            password_hash="google_oauth",
            role=RoleEnum.Employee,
            dept_id=1,
            status="Active",
            bio=random.choice(NEW_MEMBER_BIOS)
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "user_id": user.id
    }

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: Employee = Depends(get_current_active_user), session: Session = Depends(get_session)):
    from models import Department
    dept_name = "—"
    if current_user.dept_id:
        dept = session.get(Department, current_user.dept_id)
        if dept:
            dept_name = dept.name
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "dept_id": current_user.dept_id,
        "department": dept_name,
        "phone": current_user.phone or "",
        "bio": current_user.bio or ""
    }

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    new_password: Optional[str] = None

@router.put("/me", response_model=UserProfile)
def update_current_user_profile(
    data: UpdateProfileRequest,
    current_user: Employee = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    from models import Department
    user = session.get(Employee, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.name is not None:
        user.name = data.name
    if data.phone is not None:
        user.phone = data.phone
    if data.bio is not None:
        user.bio = data.bio
    if data.new_password:
        user.password_hash = get_password_hash(data.new_password)

    session.add(user)
    session.commit()
    session.refresh(user)

    dept_name = "—"
    if user.dept_id:
        dept = session.get(Department, user.dept_id)
        if dept:
            dept_name = dept.name

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "dept_id": user.dept_id,
        "department": dept_name,
        "phone": user.phone or "",
        "bio": user.bio or ""
    }
