from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.core.enums import ContractStatus

class SchemaContractCreate(BaseModel):
    property_id: int
    client_id: int
    value: float
    start_date: datetime
    end_date: datetime
    status: ContractStatus
    extra_data: Optional[dict]

class SchemaContractUpdate(BaseModel):
    property_id: int
    client_id: int
    value: float
    start_date: datetime
    end_date: datetime
    status: ContractStatus
    extra_data: Optional[dict]

class SchemaContractStatus(BaseModel):
    status: ContractStatus


class SchemaContractResponse(BaseModel):
    id: int
    landlord_id: int
    property_id: int
    client_id: int
    value: float
    start_date: datetime
    end_date: datetime
    status: ContractStatus
    extra_data: Optional[dict]
    created_at: datetime

    model_config=ConfigDict(from_attributes=True)
