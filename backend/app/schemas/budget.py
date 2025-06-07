from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid
from ..schemas.category import CategoryResponse


class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Budget name")
    amount: Decimal = Field(..., gt=0, description="Budgeted amount")
    period_year: int = Field(..., ge=2000, le=3000, description="Budget year")
    period_month: int = Field(..., ge=1, le=12, description="Budget month")
    category_id: str = Field(..., description="ID of the associated category")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Budget name")
    amount: Optional[Decimal] = Field(None, gt=0, description="Budgeted amount")
    period_year: Optional[int] = Field(None, ge=2000, le=3000, description="Budget year")
    period_month: Optional[int] = Field(None, ge=1, le=12, description="Budget month")
    category_id: Optional[str] = Field(None, description="ID of the associated category")


class BudgetResponse(BudgetBase):
    id: str
    spent_amount: Decimal
    remaining_amount: Decimal
    percentage_used: float
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class BudgetSummary(BaseModel):
    id: str
    name: str
    amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    percentage_used: float
    category_name: str
    is_over_budget: bool

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class BudgetAnalysis(BaseModel):
    year: int
    month: int
    total_budgeted: Decimal
    total_spent: Decimal
    total_remaining: Decimal
    overall_percentage_used: float
    budgets_count: int
    over_budget_count: int
    budgets: List[BudgetSummary]

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class BudgetPerformance(BaseModel):
    budget_id: str
    budget_name: str
    category_name: str
    budgeted_amount: Decimal
    spent_amount: Decimal
    variance: Decimal  # positive = under budget, negative = over budget
    variance_percentage: float
    days_remaining: int
    projected_spending: Optional[Decimal] = None  # based on current trend

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }