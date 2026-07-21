from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey

class Property(Base):
    __tablename__ = "propertys"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    addres: Mapped[str] = mapped_column()
    cep: Mapped[str] = mapped_column()
    kind: Mapped[str] = mapped_column() #enum
    status: Mapped[str] = mapped_column() #enum
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

