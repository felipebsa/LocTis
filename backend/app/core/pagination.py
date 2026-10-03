from math import ceil
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 100

T = TypeVar("T")

class Pagination:

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Página atual (começa em 1)"),
        limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Itens por página"),
    ):
        self.page = page
        self.limit = limit

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class Page(BaseModel, Generic[T]):
    items: list[T]
    page_atual: int
    page_max: int

def paginate(db: Session, query, pagination: Pagination) -> dict:
    total = db.execute(
        select(func.count()).select_from(query.order_by(None).subquery())
    ).scalar_one()
    items = db.execute(query.limit(pagination.limit).offset(pagination.offset)).scalars().all()
    return {
        "items": items,
        "page_atual": pagination.page,
        "page_max": max(1, ceil(total / pagination.limit)),
    }
