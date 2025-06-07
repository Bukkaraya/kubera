from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid
from ..models.recurring_transaction import FrequencyType


class RecurringTransactionBase(BaseModel):
    amount: Decimal
    description: str
    notes: Optional[str] = None
    frequency: FrequencyType
    start_date: datetime
    end_date: Optional[datetime] = None
    is_income: bool = False


class RecurringTransactionCreate(RecurringTransactionBase):
    account_id: uuid.UUID
    category_id: uuid.UUID


class RecurringTransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    frequency: Optional[FrequencyType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_income: Optional[bool] = None
    is_active: Optional[bool] = None
    account_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None


class RecurringTransactionResponse(RecurringTransactionBase):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID
    next_execution_date: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True