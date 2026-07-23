from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey, Enum as SQLEnum, CheckConstraint
from core.enums import ContractStatus
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    value: Mapped[float] = mapped_column()
    start_date: Mapped[datetime] = mapped_column()
    end_date: Mapped[datetime] = mapped_column()
    status: Mapped[ContractStatus] = mapped_column(SQLEnum(ContractStatus)) #enum
    extra_data:Mapped[Optional[dict]] = mapped_column(JSONB) #JSONB
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint("end_date > start_date AND value > 0", name="ck_contract_dates"),
    )