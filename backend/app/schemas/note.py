from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.core.enums import NoteEntityType

class SchemaNoteCreate(BaseModel):
    entity_type: NoteEntityType
    entity_id: int
    content: str = Field(min_length=1)

class SchemaNoteUpdate(BaseModel):
    content: str = Field(min_length=1)

class SchemaNoteResponse(BaseModel):
    id: int
    landlord_id: int
    entity_type: NoteEntityType
    entity_id: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
