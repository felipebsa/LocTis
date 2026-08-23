from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey, Enum as SQLEnum
from app.core.enums import PropertyKind, PropertyStatus

class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    address: Mapped[str] = mapped_column()
    cep: Mapped[str] = mapped_column()
    kind: Mapped[PropertyKind] = mapped_column(SQLEnum(PropertyKind)) #enum
    status: Mapped[PropertyStatus] = mapped_column(SQLEnum(PropertyStatus)) #enum
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())