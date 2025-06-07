from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid
from ..models.account import AccountType


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Account name")
    account_type: AccountType = Field(..., description="Type of account")
    initial_balance: Decimal = Field(default=0, description="Initial balance")
    description: Optional[str] = Field(None, max_length=255, description="Account description")


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Account name")
    account_type: Optional[AccountType] = Field(None, description="Type of account")
    description: Optional[str] = Field(None, max_length=255, description="Account description")
    is_active: Optional[bool] = Field(None, description="Whether account is active")


class AccountResponse(AccountBase):
    id: str
    current_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class AccountSummary(BaseModel):
    id: str
    name: str
    account_type: AccountType
    current_balance: Decimal
    is_active: bool

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }