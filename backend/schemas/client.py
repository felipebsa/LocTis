from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SchemaClientCreate(BaseModel):
    name: str
    cpf: str
    email: Optional[str]
    phone: Optional[str]

class SchemaClientResponse(BaseModel):
    id: int
    landlord_id: int
    name: str
    cpf: str
    email: str
    phone: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)