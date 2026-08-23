
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SchemaLandlordCreate(BaseModel):
    name: str
    email: str
    password: str

class SchemaLandlordResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)