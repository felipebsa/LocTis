from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class SchemaClientCreate(BaseModel):
    name: str
    cpf: str = Field(min_length=11, max_length=11)
    email: Optional[str] = None
    phone: Optional[str] = None

class SchemaClientUpdate(BaseModel):
    name: str
    cpf: str = Field(min_length=11, max_length=11)
    email: Optional[str] = None
    phone: Optional[str] = None

class SchemaClientResponse(BaseModel):
    id: int
    landlord_id: int
    name: str
    cpf: str
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
