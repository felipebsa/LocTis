from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_current_user
from app.core.enums import NoteEntityType
from app.core.pagination import Pagination, Page, paginate
from app.core.tenant import get_owned_entity
from app.models.note import Note
from app.schemas.note import SchemaNoteCreate, SchemaNoteUpdate, SchemaNoteResponse

router = APIRouter(prefix="/note", tags=["notes"])

@router.post("/register", status_code=201, response_model=SchemaNoteResponse)
def note_create(note: SchemaNoteCreate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    # a entidade referenciada precisa existir e ser do landlord autenticado
    if get_owned_entity(db, note.entity_type, note.entity_id, cl.id) is None:
        raise HTTPException(status_code=404, detail=f"{note.entity_type.value} not found")

    db_note = Note(
        landlord_id = cl.id,
        entity_type = note.entity_type,
        entity_id = note.entity_id,
        content = note.content
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/get/all", response_model=Page[SchemaNoteResponse])
def note_get_all(
    entity_type: Optional[NoteEntityType] = None,
    entity_id: Optional[int] = None,
    pagination: Pagination = Depends(),
    db: Session = Depends(get_db),
    cl=Depends(get_current_user),
):
    query = select(Note).where(Note.landlord_id == cl.id)
    if entity_type is not None:
        query = query.where(Note.entity_type == entity_type)
    if entity_id is not None:
        query = query.where(Note.entity_id == entity_id)
    query = query.order_by(Note.created_at, Note.id)
    return paginate(db, query, pagination)

@router.get("/get/id/{id}", response_model=SchemaNoteResponse)
def note_get_by_id(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Note).where(and_(Note.id == id, Note.landlord_id == cl.id))
    db_note = db.execute(query).scalar_one_or_none()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

# todas as notas de um registro específico 
@router.get("/get/entity/{entity_type}/{entity_id}", response_model=Page[SchemaNoteResponse])
def note_get_by_entity(entity_type: NoteEntityType, entity_id: int, pagination: Pagination = Depends(), db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = (
        select(Note)
        .where(and_(Note.entity_type == entity_type, Note.entity_id == entity_id, Note.landlord_id == cl.id))
        .order_by(Note.created_at, Note.id)
    )
    return paginate(db, query, pagination)

@router.put("/update/put/{id}", response_model=SchemaNoteResponse)
def note_update(id: int, note: SchemaNoteUpdate, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Note).where(and_(Note.id == id, Note.landlord_id == cl.id))
    db_note = db.execute(query).scalar_one_or_none()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db_note.content = note.content
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/delete/{id}", status_code=204)
def note_delete(id: int, db: Session = Depends(get_db), cl=Depends(get_current_user)):
    query = select(Note).where(and_(Note.id == id, Note.landlord_id == cl.id))
    db_note = db.execute(query).scalar_one_or_none()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return
