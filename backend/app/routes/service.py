from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from backend.app.schemas.service import SchemaServiceCreate, SchemaServiceResponse, SchemaServiceUpdate, SchemaServiceStatus
from backend.app.models.property import Property
from backend.app.models.service import Service
from backend.app.database import get_db 
from backend.app.core.security import get_current_user
from backend.app.core.enums import ServiceStatus

router = APIRouter(prefix="/service", tags=["service"])

@router.post("/register", status_code=201, response_model=SchemaServiceResponse)
def service_create(service: SchemaServiceCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query_p = select(Property).where(and_(Property.id==service.property_id, Property.landlord_id==cl.id))
    get_query_p = db.execute(query_p).scalar_one_or_none()
    if get_query_p is None:
        raise HTTPException(status_code=404, detail="not exist this property id")
    
    db_service = Service(
        landlord_id = cl.id,
        property_id = service.property_id,
        name = service.name,
        description = service.description,
        value = service.value,
        status = service.status
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/get/all", response_model=list[SchemaServiceResponse])
def service_get_all(db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(Service.landlord_id==cl.id)
    db_service = db.execute(query).scalars().all()
    return db_service

@router.get("/get/id/{id}", response_model=SchemaServiceResponse)
def service_get_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.id == id, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalar_one_or_none()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    return db_service

@router.get("/get/status/{status}", response_model=list[SchemaServiceResponse])
def service_get_by_status(status: ServiceStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.status == status, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalars().all()
    return db_service

@router.delete("/delete/{id}", status_code=204)
def delete_service(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.id == id, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalar_one_or_none()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(db_service)
    db.commit()
    return

@router.put("/update/put/{id}", response_model=SchemaServiceResponse)
def update_service_by_put(id: int, service: SchemaServiceUpdate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.id == id, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalar_one_or_none()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db_service.name = service.name
    db_service.description = service.description
    db_service.value = service.value
    db_service.status = service.status

    db.commit()
    db.refresh(db_service)
    return db_service

@router.patch("/update/patch/{id}", response_model=SchemaServiceResponse)
def update_status_patch_service(id: int, service: SchemaServiceStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.id == id, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalar_one_or_none()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db_service.status = service.status

    db.commit()
    db.refresh(db_service)
    return db_service

# deixa mais facil para o front pegar todos os serviços de uma propriedade especifica, sem precisar filtrar no front
@router.get("/get/property/{property_id}", response_model=list[SchemaServiceResponse])
def service_get_by_property(property_id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.property_id == property_id, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalars().all()
    return db_service

# com um status especifico
@router.get("/get/property/{property_id}/status/{status}", response_model=list[SchemaServiceResponse])
def service_get_by_property_and_status(property_id: int, status: ServiceStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Service).where(and_(Service.property_id == property_id, Service.status == status, Service.landlord_id==cl.id))
    db_service = db.execute(query).scalars().all()
    return db_service