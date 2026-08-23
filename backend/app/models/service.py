from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey, Enum as SQLEnum
from backend.app.core.enums import ServiceStatus

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"))
    name: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column()
    value: Mapped[float] = mapped_column()
    status: Mapped[ServiceStatus] = mapped_column(SQLEnum(ServiceStatus)) #enum
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

