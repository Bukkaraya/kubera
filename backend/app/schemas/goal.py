from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.goal import GoalType, GoalStatus


class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Goal name")
    description: Optional[str] = Field(None, description="Goal description")
    goal_type: GoalType = Field(..., description="Type of goal")
    target_amount: Decimal = Field(..., gt=0, description="Target amount to save")
    target_date: Optional[datetime] = Field(None, description="Target date to achieve goal")
    account_id: str = Field(..., description="ID of the linked account")

    @validator('target_date')
    def validate_target_date(cls, v, values):
        goal_type = values.get('goal_type')
        if goal_type == GoalType.AMOUNT_DATE and v is None:
            raise ValueError('target_date is required for amount+date goals')
        if v and v <= datetime.utcnow():
            raise ValueError('target_date must be in the future')
        return v


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Goal name")
    description: Optional[str] = Field(None, description="Goal description")
    target_amount: Optional[Decimal] = Field(None, ge=0, description="Target amount to save")
    target_date: Optional[datetime] = Field(None, description="Target date to achieve goal")
    status: Optional[GoalStatus] = Field(None, description="Goal status")
    current_amount: Optional[Decimal] = Field(None, ge=0, description="Current saved amount")
    is_active: Optional[bool] = Field(None, description="Whether goal is active")

    @validator('target_date')
    def validate_target_date(cls, v):
        if v and v <= datetime.utcnow():
            raise ValueError('target_date must be in the future')
        return v


class GoalProgressUpdate(BaseModel):
    current_amount: Decimal = Field(..., ge=0, description="Updated current amount")


class GoalResponse(BaseModel):
    # Basic fields - no validation needed for response data
    id: str
    name: str = Field(..., description="Goal name")
    description: Optional[str] = Field(None, description="Goal description")
    goal_type: GoalType = Field(..., description="Type of goal")
    target_amount: Decimal = Field(..., description="Target amount to save")
    target_date: Optional[datetime] = Field(None, description="Target date to achieve goal")
    account_id: str = Field(..., description="ID of the linked account")
    
    # Status fields
    status: GoalStatus
    current_amount: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    # Computed properties
    progress_percentage: float = Field(..., description="Progress percentage")
    remaining_amount: float = Field(..., description="Remaining amount")
    days_remaining: Optional[int] = Field(None, description="Days remaining for amount+date goals")
    is_completed: bool = Field(..., description="Whether goal is completed")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class GoalSummary(BaseModel):
    id: str
    name: str
    goal_type: GoalType
    status: GoalStatus
    target_amount: Decimal
    target_date: Optional[datetime]
    current_amount: Decimal
    progress_percentage: float
    is_completed: bool
    account_name: str

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class GoalStats(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    total_target_amount: Decimal
    total_current_amount: Decimal
    overall_progress_percentage: float

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        } 