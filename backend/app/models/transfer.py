from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class Transfer(Base):
    __tablename__ = "transfers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    from_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(String(255), nullable=True)
    transfer_date = Column(DateTime, nullable=False)
    from_transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    to_transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    from_account = relationship("Account", foreign_keys=[from_account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
    from_transaction = relationship("Transaction", foreign_keys=[from_transaction_id])
    to_transaction = relationship("Transaction", foreign_keys=[to_transaction_id])
    
    def __repr__(self):
        return f"<Transfer(from='{self.from_account_id}', to='{self.to_account_id}', amount='{self.amount}')>" 