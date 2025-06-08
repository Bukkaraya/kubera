from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid


class TransferCreate(BaseModel):
    from_account_id: str = Field(..., description="Source account ID")
    to_account_id: str = Field(..., description="Destination account ID")
    amount: Decimal = Field(..., gt=0, description="Transfer amount (must be positive)")
    description: Optional[str] = Field(None, max_length=255, description="Transfer description")
    transfer_date: datetime = Field(..., description="When the transfer occurred")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat()
        }


class TransferResponse(TransferCreate):
    id: str
    from_transaction_id: str
    to_transaction_id: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        } 