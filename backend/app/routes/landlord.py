from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.landlord import Landlord
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.landlord import SchemaLandlordCreate, SchemaLandlordResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.email == form_data.username).first()

    if not landlord or not verify_password(form_data.password, landlord.password_hash):
        raise HTTPException(status_code=401, detail=("Invalid credentials"))

    token = create_access_token(landlord.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", status_code=201, response_model=SchemaLandlordResponse)
def create_landlord(landlord: SchemaLandlordCreate, db: Session = Depends(get_db)):
    existing_landlord = db.query(Landlord).filter(Landlord.email == landlord.email).first()
    if existing_landlord:
        raise HTTPException(status_code=409, detail="Email already registered")
    hash_created = hash_password(landlord.password)
    post_landlord = Landlord(
        name = landlord.name,
        email = landlord.email,
        password_hash = hash_created
    )
    db.add(post_landlord)
    db.commit()
    db.refresh(post_landlord)
    return post_landlord