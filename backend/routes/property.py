from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from schemas.property import SchemaPropertyCreate, SchemaPropertyResponse, SchemaPropertyStatus
from models.property import Property
from database import get_db 
from core.security import get_current_user

router = APIRouter(prefix="/property", tags=["property"])

@router.post("/register", status_code=201, response_model=SchemaPropertyResponse)
def property_create(property: SchemaPropertyCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    # cl = current_landlord (locador autenticado)
    db_property = Property(
        landlord_id = cl.id,
        address = property.address,
        cep = property.cep,
        kind = property.kind,
        status = property.status
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property