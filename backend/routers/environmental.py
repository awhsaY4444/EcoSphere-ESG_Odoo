from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Employee, CarbonTransaction, EmissionFactor
from auth import get_current_active_user
from logic import APP_SETTINGS

router = APIRouter(tags=["environmental"])

@router.get("/carbon-transactions", response_model=List[CarbonTransaction])
def get_carbon_transactions(session: Session = Depends(get_session)):
    return session.exec(select(CarbonTransaction)).all()

@router.post("/carbon-transactions", response_model=CarbonTransaction)
def create_carbon_transaction(tx: CarbonTransaction, session: Session = Depends(get_session),
                              current_user: Employee = Depends(get_current_active_user)):
    
    if APP_SETTINGS["auto_emission_calc"] and tx.quantity > 0:
        ef = session.exec(select(EmissionFactor).where(EmissionFactor.id == tx.emission_factor_id)).first()
        if not ef:
            raise HTTPException(status_code=404, detail="Emission Factor not found")
        tx.co2e_calculated = tx.quantity * ef.co2e_per_unit
        tx.auto_calculated = True
    else:
        # If auto-calc is off, we expect co2e_calculated to be provided manually
        if tx.co2e_calculated is None:
            raise HTTPException(status_code=400, detail="co2e_calculated must be provided when auto_emission_calc is off")
            
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx
