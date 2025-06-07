from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from decimal import Decimal
from ..models.account import Account
from ..models.transaction import Transaction
from ..schemas.account import AccountCreate, AccountUpdate


class AccountService:
    
    @staticmethod
    def get_accounts(db: Session, skip: int = 0, limit: int = 100) -> List[Account]:
        """
        Get all active accounts with calculated current balances.
        """
        accounts = db.query(Account).filter(Account.is_active == True).offset(skip).limit(limit).all()
        
        # Update current balances for all accounts
        for account in accounts:
            AccountService._update_account_balance(db, account)
        
        return accounts
    
    @staticmethod
    def get_account(db: Session, account_id: str) -> Optional[Account]:
        """
        Get account by ID with updated balance.
        """
        account = db.query(Account).filter(Account.id == account_id, Account.is_active == True).first()
        if account:
            AccountService._update_account_balance(db, account)
        return account
    
    @staticmethod
    def create_account(db: Session, account_data: AccountCreate) -> Account:
        """
        Create a new account.
        """
        account = Account(
            name=account_data.name,
            account_type=account_data.account_type,
            initial_balance=account_data.initial_balance,
            current_balance=account_data.initial_balance,  # Start with initial balance
            description=account_data.description
        )
        
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    
    @staticmethod
    def update_account(db: Session, account_id: str, account_data: AccountUpdate) -> Optional[Account]:
        """
        Update an existing account.
        """
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return None
        
        update_data = account_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)
        
        db.commit()
        db.refresh(account)
        
        # Update balance after any changes
        AccountService._update_account_balance(db, account)
        return account
    
    @staticmethod
    def delete_account(db: Session, account_id: str) -> bool:
        """
        Soft delete an account by setting is_active=False.
        """
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return False
        
        account.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def get_account_balance(db: Session, account_id: str) -> Optional[Decimal]:
        """
        Get current balance for an account.
        """
        account = db.query(Account).filter(Account.id == account_id, Account.is_active == True).first()
        if not account:
            return None
        
        AccountService._update_account_balance(db, account)
        return account.current_balance
    
    @staticmethod
    def _update_account_balance(db: Session, account: Account) -> None:
        """
        Update account's current balance based on transactions.
        """
        # Calculate total transactions for this account
        transaction_total = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.account_id == account.id
        ).scalar()
        
        # Current balance = initial balance + transaction total
        account.current_balance = account.initial_balance + Decimal(str(transaction_total))
        db.commit()
    
    @staticmethod
    def get_accounts_summary(db: Session) -> dict:
        """
        Get summary of all accounts grouped by type.
        """
        accounts = AccountService.get_accounts(db)
        
        summary = {
            "total_accounts": len(accounts),
            "total_balance": sum(account.current_balance for account in accounts),
            "by_type": {}
        }
        
        # Group by account type
        for account in accounts:
            account_type = account.account_type.value
            if account_type not in summary["by_type"]:
                summary["by_type"][account_type] = {
                    "count": 0,
                    "total_balance": Decimal("0")
                }
            
            summary["by_type"][account_type]["count"] += 1
            summary["by_type"][account_type]["total_balance"] += account.current_balance
        
        return summary 