from typing import List, Optional
from sqlalchemy.orm import Session
from decimal import Decimal
from ..models.transfer import Transfer
from ..models.account import Account
from ..models.transaction import Transaction
from ..models.category import Category
from ..schemas.transfer import TransferCreate
from ..services.transaction import TransactionService


class TransferService:
    
    @staticmethod
    def create_transfer(db: Session, transfer_data: TransferCreate) -> Transfer:
        """
        Create a transfer between accounts by creating two transactions.
        """
        # Validate accounts exist and are active
        from_account = db.query(Account).filter(
            Account.id == transfer_data.from_account_id,
            Account.is_active == True
        ).first()
        if not from_account:
            raise ValueError("Source account not found or inactive")
        
        to_account = db.query(Account).filter(
            Account.id == transfer_data.to_account_id,
            Account.is_active == True
        ).first()
        if not to_account:
            raise ValueError("Destination account not found or inactive")
        
        # Validate accounts are different
        if transfer_data.from_account_id == transfer_data.to_account_id:
            raise ValueError("Source and destination accounts must be different")
        
        # Check if from_account has sufficient balance
        from ..services.account import AccountService
        AccountService._update_account_balance(db, from_account)
        if from_account.current_balance < transfer_data.amount:
            raise ValueError("Insufficient balance in source account")
        
        # Get or create "Transfer" category
        transfer_category = db.query(Category).filter(Category.name == "Transfer").first()
        if not transfer_category:
            transfer_category = Category(
                name="Transfer",
                description="Internal transfers between accounts",
                is_predefined=True
            )
            db.add(transfer_category)
            db.flush()  # Get the ID without committing
        
        # Create outgoing transaction (negative amount from source account)
        from_transaction = Transaction(
            amount=-transfer_data.amount,  # Negative for outgoing
            payee=f"Transfer to {to_account.name}",
            notes=transfer_data.description or f"Transfer to {to_account.name}",
            transaction_date=transfer_data.transfer_date,
            is_income=False,
            account_id=transfer_data.from_account_id,
            category_id=transfer_category.id
        )
        db.add(from_transaction)
        db.flush()
        
        # Create incoming transaction (positive amount to destination account)
        to_transaction = Transaction(
            amount=transfer_data.amount,  # Positive for incoming
            payee=f"Transfer from {from_account.name}",
            notes=transfer_data.description or f"Transfer from {from_account.name}",
            transaction_date=transfer_data.transfer_date,
            is_income=True,
            account_id=transfer_data.to_account_id,
            category_id=transfer_category.id
        )
        db.add(to_transaction)
        db.flush()
        
        # Create transfer record
        transfer = Transfer(
            from_account_id=transfer_data.from_account_id,
            to_account_id=transfer_data.to_account_id,
            amount=transfer_data.amount,
            description=transfer_data.description,
            transfer_date=transfer_data.transfer_date,
            from_transaction_id=from_transaction.id,
            to_transaction_id=to_transaction.id
        )
        db.add(transfer)
        db.commit()
        db.refresh(transfer)
        
        # Update account balances
        AccountService._update_account_balance(db, from_account)
        AccountService._update_account_balance(db, to_account)
        
        return transfer
    
    @staticmethod
    def get_transfers(db: Session, skip: int = 0, limit: int = 100) -> List[Transfer]:
        """
        Get all transfers with pagination.
        """
        return db.query(Transfer).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_transfer(db: Session, transfer_id: str) -> Optional[Transfer]:
        """
        Get a specific transfer by ID.
        """
        return db.query(Transfer).filter(Transfer.id == transfer_id).first() 