from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.core.enums import ServiceStatus

class SchemaServiceCreate(BaseModel):
    property_id: int
    name: str
    description: str
    value: float
    status: ServiceStatus

class SchemaServiceUpdate(BaseModel):
    property_id: int
    name: str
    description: str
    value: float
    status: ServiceStatus

class SchemaServiceStatus(BaseModel):
    status: ServiceStatus

class SchemaServiceResponse(BaseModel):
    id: int
    landlord_id: int
    property_id: int
    name: str
    description: str
    value: float
    status: ServiceStatus
    created_at: datetime

    model_config=ConfigDict(from_attributes=True)


