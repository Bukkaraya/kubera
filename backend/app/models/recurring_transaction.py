from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from ..core.database import Base


class FrequencyType(PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    frequency = Column(Enum(FrequencyType), nullable=False)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=True)
    next_execution_date = Column(DateTime, nullable=False, index=True)
    is_income = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True)
    
    # Relationships
    account = relationship("Account", back_populates="recurring_transactions")
    category = relationship("Category")
    generated_transactions = relationship("Transaction", back_populates="recurring_transaction")
    
    def __repr__(self):
        return f"<RecurringTransaction(amount={self.amount}, frequency='{self.frequency.value}')>"