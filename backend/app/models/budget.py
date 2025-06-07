from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..core.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    spent_amount = Column(Numeric(precision=10, scale=2), default=0)
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)
    
    # Relationships
    category = relationship("Category", back_populates="budgets")
    
    @property
    def remaining_amount(self):
        return self.amount - self.spent_amount
    
    @property
    def percentage_used(self):
        if self.amount == 0:
            return 0
        return (self.spent_amount / self.amount) * 100
    
    def __repr__(self):
        return f"<Budget(name='{self.name}', amount={self.amount}, period={self.period_year}-{self.period_month:02d})>"