from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime
from sqlalchemy import func

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[int] = mapped_column(primary_key=True)