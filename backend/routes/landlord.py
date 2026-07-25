from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.landlord import Landlord
from core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.email == form_data.username).first()

    if not landlord or not verify_password(form_data.password, landlord.password_hash):
        raise HTTPException(status_code=401, detail=("Invalid credentials"))

    token = create_access_token(landlord.id)
    return {"access_token": token, "token_type": "bearer"}