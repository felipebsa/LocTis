from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.core.security import get_current_user
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.schemas.contract import SchemaContractCreate, SchemaContractResponse, SchemaContractStatus, SchemaContractUpdate, ContractStatus
from app.models.contract import Contract
from app.models.client import Client
from app.models.property import Property
from app.core.enums import ContractStatus

router = APIRouter(prefix="/contract", tags=["contracts"])

@router.post("/register", status_code=201, response_model=SchemaContractResponse)
def contract_create(contract: SchemaContractCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query_p = select(Property).where(and_(Property.id==contract.property_id, Property.landlord_id==cl.id))
    get_query_p = db.execute(query_p).scalar_one_or_none()
    if get_query_p is None:
        raise HTTPException(status_code=404, detail="not exist this property id")
    
    query_c = select(Client).where(and_(Client.id==contract.client_id, Client.landlord_id==cl.id))
    get_query_c = db.execute(query_c).scalar_one_or_none()
    if get_query_c is None:
        raise HTTPException(status_code=404, detail="not exist this client id")
    
    db_contract = Contract(
        landlord_id = cl.id,
        property_id = contract.property_id,
        client_id = contract.client_id,
        value = contract.value,
        start_date = contract.start_date,
        end_date = contract.end_date,
        status = contract.status,
        extra_data = contract.extra_data
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.get("/get/all", response_model=list[SchemaContractResponse])
def contract_get_all(db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(Contract.landlord_id==cl.id)
    db_contract = db.execute(query).scalars().all()
    return db_contract

@router.get("/get/id/{id}", response_model=SchemaContractResponse)
def contract_get_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.id == id, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalar_one_or_none()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db_contract

@router.get("/get/status/{status}", response_model=list[SchemaContractResponse])
def contract_get_by_status(status: ContractStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.status == status, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalars().all()
    return db_contract

@router.delete("/delete/{id}", status_code=204)
def delete_contract(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.id == id, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalar_one_or_none()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(db_contract)
    db.commit()
    return

@router.put("/update/put/{id}", response_model=SchemaContractResponse)
def update_by_put_contract(id: int, contract: SchemaContractUpdate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.id == id, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalar_one_or_none()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    query_p = select(Property).where(and_(Property.id==contract.property_id, Property.landlord_id==cl.id))
    get_query_p = db.execute(query_p).scalar_one_or_none()
    if get_query_p is None:
        raise HTTPException(status_code=404, detail="not exist this property id")
    
    query_c = select(Client).where(and_(Client.id==contract.client_id, Client.landlord_id==cl.id))
    get_query_c = db.execute(query_c).scalar_one_or_none()
    if get_query_c is None:
        raise HTTPException(status_code=404, detail="not exist this client id")
    
    db_contract.property_id = contract.property_id
    db_contract.client_id = contract.client_id
    db_contract.value = contract.value
    db_contract.start_date = contract.start_date
    db_contract.end_date = contract.end_date
    db_contract.status = contract.status
    db_contract.extra_data = contract.extra_data
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.patch("/update/patch/{id}", response_model=SchemaContractResponse)
def update_status_patch_contract(id: int, contract: SchemaContractStatus, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.id == id, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalar_one_or_none()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db_contract.status = contract.status
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.get("/get/property/{property_id}", response_model=list[SchemaContractResponse])
def contract_get_by_property_id(property_id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Contract).where(and_(Contract.property_id == property_id, Contract.landlord_id==cl.id))
    db_contract = db.execute(query).scalars().all()
    return db_contract