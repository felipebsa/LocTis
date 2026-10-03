from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.core.security import get_current_user
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.schemas.client import SchemaClientCreate, SchemaClientResponse, SchemaClientUpdate
from app.models.client import Client
from app.core.enums import NoteEntityType
from app.core.pagination import Pagination, Page, paginate
from app.core.tenant import delete_entity_notes

router = APIRouter(prefix="/client", tags=["clients"])

@router.post("/register", status_code=201,response_model=SchemaClientResponse)
def client_create(client: SchemaClientCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    db_client = Client(
        landlord_id = cl.id,
        name = client.name,
        cpf = client.cpf,
        email = client.email,
        phone = client.phone
    )
    db.add(db_client)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CPF already registered for this landlord")
    db.refresh(db_client)
    return db_client

@router.get("/get/all", response_model=Page[SchemaClientResponse])
def get_all_clients(
    name: Optional[str] = None,
    cpf: Optional[str] = None,
    pagination: Pagination = Depends(),
    db: Session = Depends(get_db),
    cl=Depends(get_current_user),
):
    query = select(Client).where(Client.landlord_id == cl.id)
    if name:
        query = query.where(Client.name.ilike(f"%{name}%"))
    if cpf:
        query = query.where(Client.cpf == cpf)
    query = query.order_by(Client.created_at, Client.id)
    return paginate(db, query, pagination)

@router.get("/get/id/{id}", response_model=SchemaClientResponse)
def get_client_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Client).where(and_(Client.id == id, Client.landlord_id == cl.id))
    db_client = db.execute(query).scalar_one_or_none()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.delete("/delete/{id}", status_code=204)
def delete_client(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Client).where(and_(Client.id == id, Client.landlord_id == cl.id))
    db_client = db.execute(query).scalar_one_or_none()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    delete_entity_notes(db, NoteEntityType.CLIENT, id, cl.id)
    db.delete(db_client)
    db.commit()
    return

@router.put("/update/put/{id}", response_model=SchemaClientResponse)
def update_client_by_put(id: int, client: SchemaClientUpdate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Client).where(and_(Client.id == id, Client.landlord_id == cl.id))
    db_client = db.execute(query).scalar_one_or_none()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    db_client.name = client.name
    db_client.cpf = client.cpf
    db_client.email = client.email
    db_client.phone = client.phone

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CPF already registered for this landlord")
    db.refresh(db_client)
    return db_client
