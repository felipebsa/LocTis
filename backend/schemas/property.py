from pydantic import BaseModel, ConfigDict
from datetime import datetime
from core.enums import PropertyKind, PropertyStatus

class SchemaPropertyCreate(BaseModel):
    address: str
    cep: str
    kind: PropertyKind
    status: PropertyStatus

class SchemaPropertyUpdate(BaseModel):
    address: str
    cep: str
    kind: PropertyKind
    status: PropertyStatus

class SchemaPropertyStatus(BaseModel):
    status: PropertyStatus

class SchemaPropertyResponse(BaseModel):
    id: int
    landlord_id: int
    address: str
    cep: str
    kind: PropertyKind
    status: PropertyStatus
    created_at: datetime

    model_config=ConfigDict(from_attributes=True)
