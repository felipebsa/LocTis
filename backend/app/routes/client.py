from fastapi import APIRouter, HTTPException, Depends
from backend.app.database import get_db
from backend.app.core.security import get_current_user
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from backend.app.schemas.client import SchemaClientCreate, SchemaClientResponse, SchemaClientUpdate
from backend.app.models.client import Client

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
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/get/all", response_model=list[SchemaClientResponse])
def get_all_clients(db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Client).where(Client.landlord_id == cl.id)
    db_client = db.execute(query).scalars().all()
    return db_client

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

    db.commit()
    db.refresh(db_client)
    return db_client
