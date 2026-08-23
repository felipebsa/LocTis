from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey, String, UniqueConstraint
from typing import Optional

class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    name: Mapped[str] = mapped_column()
    cpf: Mapped[str] = mapped_column(String(11))
    email: Mapped[Optional[str]] = mapped_column()
    phone: Mapped[Optional[str]] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        UniqueConstraint("landlord_id", "cpf", name="uq_client_landlord_cpf"),
    )
