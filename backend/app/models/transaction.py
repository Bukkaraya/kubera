from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    is_income = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)
    recurring_transaction_id = Column(String(36), ForeignKey("recurring_transactions.id"), nullable=True)
    
    # Relationships
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    recurring_transaction = relationship("RecurringTransaction", back_populates="generated_transactions")
    
    def __repr__(self):
        return f"<Transaction(amount={self.amount}, description='{self.description}')>"