from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from app.schemas.property import SchemaPropertyCreate, SchemaPropertyResponse, SchemaPropertyStatus, SchemaPropertyUpdate
from app.models.property import Property
from app.database import get_db
from app.core.security import get_current_user
from app.core.enums import PropertyStatus, PropertyKind, NoteEntityType
from app.core.pagination import Pagination, Page, paginate
from app.core.tenant import delete_entity_notes
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/property", tags=["property"])

@router.post("/register", status_code=201, response_model=SchemaPropertyResponse)
def property_create(property: SchemaPropertyCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    # cl = current_landlord (locador autenticado)
    db_property = Property(
        landlord_id = cl.id,
        address = property.address,
        cep = property.cep,
        kind = property.kind,
        status = property.status,
        extra_data = property.extra_data
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@router.get("/get/all", response_model=Page[SchemaPropertyResponse])
def property_get_all(
    status: Optional[PropertyStatus] = None,
    kind: Optional[PropertyKind] = None,
    address: Optional[str] = None,
    pagination: Pagination = Depends(),
    db: Session = Depends(get_db),
    cl=Depends(get_current_user),
):
    query = select(Property).where(Property.landlord_id == cl.id)
    if status is not None:
        query = query.where(Property.status == status)
    if kind is not None:
        query = query.where(Property.kind == kind)
    if address:
        query = query.where(Property.address.ilike(f"%{address}%"))
    query = query.order_by(Property.created_at, Property.id)
    return paginate(db, query, pagination)

@router.get("/get/id/{id}", response_model=SchemaPropertyResponse)
def property_get_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.get("/get/status/{status}", response_model=Page[SchemaPropertyResponse])
def property_get_by_status(status: PropertyStatus, pagination: Pagination = Depends(), db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = (
        select(Property)
        .where(and_(Property.status == status, Property.landlord_id==cl.id))
        .order_by(Property.created_at, Property.id)
    )
    return paginate(db, query, pagination)

@router.delete("/delete/{id}", status_code=204)
def delete_property(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Property).where(and_(Property.id == id, Property.landlord_id==cl.id))
    db_property = db.execute(query).scalar_one_or_none()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    delete_entity_notes(db, NoteEntityType.PROPERTY, id, cl.id)
    db.delete(db_property)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Property has contracts or services linked to it")
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
    db_property.extra_data = property.extra_data
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
