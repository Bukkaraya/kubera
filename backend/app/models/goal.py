from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from ..core.database import Base


class GoalType(PyEnum):
    AMOUNT = "amount"           # Save $X (no deadline)
    AMOUNT_DATE = "amount_date" # Save $X by date Y


class GoalStatus(PyEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    goal_type = Column(Enum(GoalType), nullable=False)
    status = Column(Enum(GoalStatus), nullable=False, default=GoalStatus.ACTIVE)
    
    # Goal parameters
    target_amount = Column(Numeric(precision=10, scale=2), nullable=False)  # Required for all goals
    target_date = Column(DateTime, nullable=True)  # Required for AMOUNT_DATE
    
    # Progress tracking (manual for now)
    current_amount = Column(Numeric(precision=10, scale=2), nullable=False, default=0)
    
    # Account relationship
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False, index=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    account = relationship("Account", back_populates="goals")
    
    def __repr__(self):
        return f"<Goal(name='{self.name}', type='{self.goal_type.value}', status='{self.status.value}')>"
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage for all goals."""
        if self.target_amount:
            return min(float(self.current_amount / self.target_amount) * 100, 100.0)
        return 0.0
    
    @property
    def is_completed(self) -> bool:
        """Check if goal is completed based on its type."""
        if self.status == GoalStatus.COMPLETED:
            return True
        
        if self.goal_type == GoalType.AMOUNT:
            return self.current_amount >= self.target_amount
        elif self.goal_type == GoalType.AMOUNT_DATE:
            return self.current_amount >= self.target_amount or datetime.utcnow() >= self.target_date
        
        return False
    
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining amount for all goals."""
        return max(float(self.target_amount - self.current_amount), 0.0)
    
    @property
    def days_remaining(self) -> int:
        """Calculate days remaining for AMOUNT_DATE goals."""
        if self.goal_type == GoalType.AMOUNT_DATE and self.target_date:
            delta = self.target_date - datetime.utcnow()
            return max(delta.days, 0)
        return 0 