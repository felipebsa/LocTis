from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from backend.app.schemas.property import SchemaPropertyCreate, SchemaPropertyResponse, SchemaPropertyStatus, SchemaPropertyUpdate
from backend.app.models.property import Property
from backend.app.database import get_db 
from backend.app.core.security import get_current_user
from backend.app.core.enums import PropertyStatus

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

@router.get("/get/all", response_model=list[SchemaPropertyResponse])
def property_get_all(db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(Property.landlord_id==cl.id)
    db_property = db.execute(query).scalars().all()
    return db_property

@router.get("/get/id/{id}", response_model=SchemaPropertyResponse)
def property_get_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.get("/get/status/{status}", response_model=list[SchemaPropertyResponse])
def property_get_by_status(status: PropertyStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.status == status, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalars().all()
    return db_property

@router.delete("/delete/{id}", status_code=204)
def delete_property(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(db_property)
    db.commit()
    return 

@router.put("/update/put/{id}", response_model=SchemaPropertyResponse)
def update_by_put_property(id: int, property: SchemaPropertyUpdate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    db_property.address = property.address
    db_property.cep = property.cep
    db_property.kind = property.kind
    db_property.status = property.status
    db.commit()
    db.refresh(db_property)
    return db_property

@router.patch("/update/patch/{id}", response_model=SchemaPropertyResponse)
def update_status_patch_property(id: int, property: SchemaPropertyStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    db_property.status = property.status
    db.commit()
    db.refresh(db_property)
    return db_property