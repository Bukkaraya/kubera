from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from ..core.database import Base


class AccountType(PyEnum):
    CHECKING = "checking"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    CREDIT_CARD = "credit_card"
    CASH = "cash"


class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False, index=True)
    account_type = Column(Enum(AccountType), nullable=False)
    initial_balance = Column(Numeric(precision=10, scale=2), nullable=False, default=0)
    current_balance = Column(Numeric(precision=10, scale=2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="account")
    recurring_transactions = relationship("RecurringTransaction", back_populates="account")
    
    def __repr__(self):
        return f"<Account(name='{self.name}', type='{self.account_type.value}')>"