from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid
from ..models.account import AccountType


class AccountBase(BaseModel):
    name: str
    account_type: AccountType
    description: Optional[str] = None


class AccountCreate(AccountBase):
    initial_balance: Decimal = Decimal("0.00")


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[AccountType] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AccountResponse(AccountBase):
    id: uuid.UUID
    initial_balance: Decimal
    current_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True