from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
import uuid
from ..schemas.account import AccountSummary
from ..schemas.category import CategoryResponse


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., description="Transaction amount (positive for income, negative for expense)")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    notes: Optional[str] = Field(None, description="Additional notes")
    transaction_date: datetime = Field(..., description="When the transaction occurred")
    is_income: bool = Field(default=False, description="Whether this is an income transaction")
    account_id: str = Field(..., description="ID of the associated account")
    category_id: str = Field(..., description="ID of the associated category")


class TransactionCreate(TransactionBase):
    @validator('amount')
    def validate_amount(cls, v, values):
        if 'is_income' in values:
            if values['is_income'] and v < 0:
                raise ValueError('Income transactions must have positive amounts')
            elif not values['is_income'] and v > 0:
                raise ValueError('Expense transactions must have negative amounts')
        return v


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, description="Transaction amount")
    description: Optional[str] = Field(None, min_length=1, max_length=255, description="Transaction description")
    notes: Optional[str] = Field(None, description="Additional notes")
    transaction_date: Optional[datetime] = Field(None, description="When the transaction occurred")
    is_income: Optional[bool] = Field(None, description="Whether this is an income transaction")
    account_id: Optional[str] = Field(None, description="ID of the associated account")
    category_id: Optional[str] = Field(None, description="ID of the associated category")


class TransactionResponse(TransactionBase):
    id: str
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


class TransactionFilter(BaseModel):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_income: Optional[bool] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search: Optional[str] = None


class TransactionSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_amount: Decimal
    transaction_count: int
    average_transaction: Decimal

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class CategorySummary(BaseModel):
    category_id: str
    category_name: str
    total_amount: Decimal
    transaction_count: int
    percentage: float

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }