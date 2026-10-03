from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime
from sqlalchemy import func, ForeignKey, Enum as SQLEnum, Index, Text
from app.core.enums import NoteEntityType

class Note(Base):
    """Nota polimórfica: aponta para (entity_type, entity_id) sem FK, e é sempre escopada por landlord_id."""
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("landlords.id"))
    entity_type: Mapped[NoteEntityType] = mapped_column(SQLEnum(NoteEntityType)) #enum
    entity_id: Mapped[int] = mapped_column()
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        Index("ix_notes_entity", "entity_type", "entity_id"),
    )
