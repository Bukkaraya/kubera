from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_, or_
from decimal import Decimal
from datetime import date, datetime, timedelta
from ..models.transaction import Transaction
from ..models.account import Account
from ..models.category import Category
from ..schemas.transaction import TransactionCreate, TransactionUpdate, TransactionFilter


class TransactionService:
    
    @staticmethod
    def get_transactions(
        db: Session, 
        filters: TransactionFilter, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Transaction]:
        """
        Get transactions with optional filtering.
        """
        query = db.query(Transaction).options(
            joinedload(Transaction.account),
            joinedload(Transaction.category)
        )
        
        # Apply filters
        query = TransactionService._apply_filters(query, filters)
        
        # Order by transaction date (newest first)
        query = query.order_by(desc(Transaction.transaction_date))
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_transaction(db: Session, transaction_id: str) -> Optional[Transaction]:
        """
        Get transaction by ID with related data.
        """
        return db.query(Transaction).options(
            joinedload(Transaction.account),
            joinedload(Transaction.category)
        ).filter(Transaction.id == transaction_id).first()
    
    @staticmethod
    def create_transaction(db: Session, transaction_data: TransactionCreate) -> Transaction:
        """
        Create a new transaction.
        """
        # Validate account exists
        account = db.query(Account).filter(
            Account.id == transaction_data.account_id,
            Account.is_active == True
        ).first()
        if not account:
            raise ValueError("Account not found or inactive")
        
        # Validate category exists
        category = db.query(Category).filter(Category.id == transaction_data.category_id).first()
        if not category:
            raise ValueError("Category not found")
        
        # Create transaction
        transaction = Transaction(
            amount=transaction_data.amount,
            payee=transaction_data.payee,
            notes=transaction_data.notes,
            transaction_date=transaction_data.transaction_date,
            is_income=transaction_data.is_income,
            account_id=transaction_data.account_id,
            category_id=transaction_data.category_id
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Update account balance
        from .account import AccountService
        AccountService._update_account_balance(db, account)
        
        return transaction
    
    @staticmethod
    def update_transaction(
        db: Session, 
        transaction_id: str, 
        transaction_data: TransactionUpdate
    ) -> Optional[Transaction]:
        """
        Update an existing transaction.
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return None
        
        # Store old account for balance update
        old_account_id = transaction.account_id
        
        # Update fields
        update_data = transaction_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "account_id" and value:
                # Validate new account exists
                account = db.query(Account).filter(
                    Account.id == value,
                    Account.is_active == True
                ).first()
                if not account:
                    raise ValueError("Account not found or inactive")
            elif field == "category_id" and value:
                # Validate new category exists
                category = db.query(Category).filter(Category.id == value).first()
                if not category:
                    raise ValueError("Category not found")
            
            setattr(transaction, field, value)
        
        db.commit()
        db.refresh(transaction)
        
        # Update balances for affected accounts
        from .account import AccountService
        old_account = db.query(Account).filter(Account.id == old_account_id).first()
        if old_account:
            AccountService._update_account_balance(db, old_account)
        
        if transaction.account_id != old_account_id:
            new_account = db.query(Account).filter(Account.id == transaction.account_id).first()
            if new_account:
                AccountService._update_account_balance(db, new_account)
        
        return transaction
    
    @staticmethod
    def delete_transaction(db: Session, transaction_id: str) -> bool:
        """
        Delete a transaction.
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return False
        
        account_id = transaction.account_id
        db.delete(transaction)
        db.commit()
        
        # Update account balance
        from .account import AccountService
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            AccountService._update_account_balance(db, account)
        
        return True
    
    @staticmethod
    def get_monthly_summary(
        db: Session, 
        year: int, 
        month: int, 
        account_id: Optional[str] = None
    ) -> dict:
        """
        Get monthly transaction summary.
        """
        # Create date range for the month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        query = db.query(Transaction).filter(
            and_(
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
        
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        transactions = query.all()
        
        total_income = sum(t.amount for t in transactions if t.is_income)
        total_expenses = sum(abs(t.amount) for t in transactions if not t.is_income)
        
        return {
            "year": year,
            "month": month,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_amount": total_income - total_expenses,
            "transaction_count": len(transactions)
        }
    
    @staticmethod
    def get_category_summary(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[str] = None
    ) -> List[dict]:
        """
        Get transaction summary by category.
        """
        query = db.query(
            Category.id,
            Category.name,
            func.sum(Transaction.amount).label('total_amount'),
            func.count(Transaction.id).label('transaction_count')
        ).join(Transaction)
        
        # Apply filters
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        results = query.group_by(Category.id, Category.name).all()
        
        # Calculate total for percentage calculation
        total_amount = sum(abs(r.total_amount) for r in results)
        
        summary = []
        for result in results:
            percentage = (abs(result.total_amount) / total_amount * 100) if total_amount > 0 else 0
            summary.append({
                "category_id": str(result.id),
                "category_name": result.name,
                "total_amount": result.total_amount,
                "transaction_count": result.transaction_count,
                "percentage": round(percentage, 2)
            })
        
        return sorted(summary, key=lambda x: abs(x["total_amount"]), reverse=True)
    
    @staticmethod
    def _apply_filters(query, filters: TransactionFilter):
        """
        Apply filters to the transaction query.
        """
        if filters.account_id:
            query = query.filter(Transaction.account_id == filters.account_id)
        
        if filters.category_id:
            query = query.filter(Transaction.category_id == filters.category_id)
        
        if filters.start_date:
            query = query.filter(Transaction.transaction_date >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(Transaction.transaction_date <= filters.end_date)
        
        if filters.is_income is not None:
            query = query.filter(Transaction.is_income == filters.is_income)
        
        if filters.min_amount is not None:
            query = query.filter(Transaction.amount >= filters.min_amount)
        
        if filters.max_amount is not None:
            query = query.filter(Transaction.amount <= filters.max_amount)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Transaction.payee.ilike(search_term),
                    Transaction.notes.ilike(search_term)
                )
            )
        
        return query 