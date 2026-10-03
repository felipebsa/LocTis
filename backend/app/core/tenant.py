
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import Session

from app.core.enums import NoteEntityType
from app.models.property import Property
from app.models.client import Client
from app.models.contract import Contract
from app.models.service import Service
from app.models.note import Note

ENTITY_MODELS = {
    NoteEntityType.PROPERTY: Property,
    NoteEntityType.CLIENT: Client,
    NoteEntityType.CONTRACT: Contract,
    NoteEntityType.SERVICE: Service,
}


def get_owned_entity(db: Session, entity_type: NoteEntityType, entity_id: int, landlord_id: int):
    model = ENTITY_MODELS[entity_type]
    query = select(model).where(and_(model.id == entity_id, model.landlord_id == landlord_id))
    return db.execute(query).scalar_one_or_none()


def delete_entity_notes(db: Session, entity_type: NoteEntityType, entity_id: int, landlord_id: int):
    db.execute(
        delete(Note).where(
            and_(Note.entity_type == entity_type, Note.entity_id == entity_id, Note.landlord_id == landlord_id)
        )
    )
