from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid
from ..models.recurring_transaction import FrequencyType
from ..schemas.account import AccountSummary
from ..schemas.category import CategoryResponse


class RecurringTransactionBase(BaseModel):
    amount: Decimal = Field(..., description="Transaction amount")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    notes: Optional[str] = Field(None, description="Additional notes")
    frequency: FrequencyType = Field(..., description="How often this transaction repeats")
    start_date: datetime = Field(..., description="When recurring transactions should start")
    end_date: Optional[datetime] = Field(None, description="When recurring transactions should end (optional)")
    is_income: bool = Field(default=False, description="Whether this is an income transaction")
    account_id: str = Field(..., description="ID of the associated account")
    category_id: str = Field(..., description="ID of the associated category")


class RecurringTransactionCreate(RecurringTransactionBase):
    @validator('amount')
    def validate_amount(cls, v, values):
        if 'is_income' in values:
            if values['is_income'] and v < 0:
                raise ValueError('Income transactions must have positive amounts')
            elif not values['is_income'] and v > 0:
                raise ValueError('Expense transactions must have negative amounts')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class RecurringTransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, description="Transaction amount")
    description: Optional[str] = Field(None, min_length=1, max_length=255, description="Transaction description")
    notes: Optional[str] = Field(None, description="Additional notes")
    frequency: Optional[FrequencyType] = Field(None, description="How often this transaction repeats")
    start_date: Optional[datetime] = Field(None, description="When recurring transactions should start")
    end_date: Optional[datetime] = Field(None, description="When recurring transactions should end")
    is_income: Optional[bool] = Field(None, description="Whether this is an income transaction")
    account_id: Optional[str] = Field(None, description="ID of the associated account")
    category_id: Optional[str] = Field(None, description="ID of the associated category")
    is_active: Optional[bool] = Field(None, description="Whether this recurring transaction is active")


class RecurringTransactionResponse(RecurringTransactionBase):
    id: str
    next_execution_date: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime
    account: Optional[AccountSummary] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class RecurringTransactionSummary(BaseModel):
    id: str
    description: str
    amount: Decimal
    frequency: FrequencyType
    next_execution_date: datetime
    is_active: bool
    account_name: str
    category_name: str

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }