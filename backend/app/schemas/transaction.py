from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid
from ..schemas.account import AccountSummary
from ..schemas.category import CategoryResponse


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., description="Transaction amount (positive for income, negative for expense)")
    payee: str = Field(..., min_length=1, max_length=255, description="Who the transaction was paid to")
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
    payee: Optional[str] = Field(None, min_length=1, max_length=255, description="Who the transaction was paid to")
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


# CSV Upload Related Schemas
class CSVTransactionRow(BaseModel):
    """Schema for validating individual CSV transaction rows"""
    transaction_date: str = Field(..., description="Transaction date from CSV")
    payee: str = Field(..., description="Payee/merchant from CSV")
    amount: str = Field(..., description="Transaction amount from CSV")
    raw_row: Optional[str] = Field(None, description="Original CSV row for debugging")
    row_number: Optional[int] = Field(None, description="Row number in CSV file")


class CSVUploadRequest(BaseModel):
    """Schema for CSV upload request parameters"""
    account_id: str = Field(..., description="Account ID to assign all transactions to")
    default_category_id: str = Field(..., description="Default category ID for transactions")
    skip_header: bool = Field(default=False, description="Whether to skip the first row as header")
    date_format: Optional[str] = Field(default="%Y-%m-%d", description="Expected date format in CSV")
    transaction_categories: Optional[dict[int, str]] = Field(default=None, description="Category assignments per transaction row")


class CSVTransactionError(BaseModel):
    """Schema for individual transaction processing errors"""
    row_number: int = Field(..., description="Row number where error occurred")
    error_message: str = Field(..., description="Description of the error")
    raw_data: Optional[str] = Field(None, description="Raw data that caused the error")


class CSVUploadResponse(BaseModel):
    """Schema for CSV upload response"""
    success: bool = Field(..., description="Whether the upload was successful")
    total_rows: int = Field(..., description="Total number of rows processed")
    successful_imports: int = Field(..., description="Number of successfully imported transactions")
    failed_imports: int = Field(..., description="Number of failed transaction imports")
    errors: List[CSVTransactionError] = Field(default=[], description="List of errors encountered")
    imported_transaction_ids: List[str] = Field(default=[], description="IDs of successfully imported transactions")
    message: str = Field(..., description="Summary message")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class CSVPreviewRow(BaseModel):
    """Schema for CSV preview before upload"""
    row_number: int
    transaction_date: str
    payee: str
    amount: Decimal
    parsed_date: Optional[datetime] = None
    is_valid: bool = True
    errors: List[str] = Field(default=[])


class CSVPreviewResponse(BaseModel):
    """Schema for CSV preview response"""
    total_rows: int
    preview_rows: List[CSVPreviewRow] = Field(max_items=10, description="First 10 rows for preview")
    has_header: bool
    detected_format: str
    estimated_valid_rows: int
    validation_errors: List[str] = Field(default=[])