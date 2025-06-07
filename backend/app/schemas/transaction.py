from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid


class TransactionBase(BaseModel):
    amount: Decimal
    description: str
    notes: Optional[str] = None
    transaction_date: datetime
    is_income: bool = False


class TransactionCreate(TransactionBase):
    account_id: uuid.UUID
    category_id: uuid.UUID


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    transaction_date: Optional[datetime] = None
    is_income: Optional[bool] = None
    account_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID
    recurring_transaction_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True