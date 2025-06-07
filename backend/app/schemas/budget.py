from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid


class BudgetBase(BaseModel):
    name: str
    amount: Decimal
    period_year: int
    period_month: int


class BudgetCreate(BudgetBase):
    category_id: uuid.UUID


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    period_year: Optional[int] = None
    period_month: Optional[int] = None
    category_id: Optional[uuid.UUID] = None


class BudgetResponse(BudgetBase):
    id: uuid.UUID
    category_id: uuid.UUID
    spent_amount: Decimal
    remaining_amount: Decimal
    percentage_used: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True