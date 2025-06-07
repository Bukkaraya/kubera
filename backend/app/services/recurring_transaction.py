from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, or_
from decimal import Decimal
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from ..models.recurring_transaction import RecurringTransaction, FrequencyType
from ..models.transaction import Transaction
from ..models.account import Account
from ..models.category import Category
from ..schemas.recurring_transaction import RecurringTransactionCreate, RecurringTransactionUpdate


class RecurringTransactionService:
    
    @staticmethod
    def get_recurring_transactions(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None,
        account_id: Optional[str] = None,
        category_id: Optional[str] = None
    ) -> List[RecurringTransaction]:
        """
        Get recurring transactions with optional filtering.
        """
        query = db.query(RecurringTransaction).options(
            joinedload(RecurringTransaction.account),
            joinedload(RecurringTransaction.category)
        )
        
        if is_active is not None:
            query = query.filter(RecurringTransaction.is_active == is_active)
        
        if account_id:
            query = query.filter(RecurringTransaction.account_id == account_id)
        
        if category_id:
            query = query.filter(RecurringTransaction.category_id == category_id)
        
        return query.order_by(desc(RecurringTransaction.next_execution_date)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_recurring_transaction(db: Session, recurring_transaction_id: str) -> Optional[RecurringTransaction]:
        """
        Get recurring transaction by ID with related data.
        """
        return db.query(RecurringTransaction).options(
            joinedload(RecurringTransaction.account),
            joinedload(RecurringTransaction.category)
        ).filter(RecurringTransaction.id == recurring_transaction_id).first()
    
    @staticmethod
    def create_recurring_transaction(
        db: Session, 
        recurring_transaction_data: RecurringTransactionCreate
    ) -> RecurringTransaction:
        """
        Create a new recurring transaction.
        """
        # Validate account exists
        account = db.query(Account).filter(
            Account.id == recurring_transaction_data.account_id,
            Account.is_active == True
        ).first()
        if not account:
            raise ValueError("Account not found or inactive")
        
        # Validate category exists
        category = db.query(Category).filter(
            Category.id == recurring_transaction_data.category_id
        ).first()
        if not category:
            raise ValueError("Category not found")
        
        # Calculate next execution date
        next_execution_date = RecurringTransactionService._calculate_next_execution_date(
            recurring_transaction_data.start_date, 
            recurring_transaction_data.frequency
        )
        
        # Create recurring transaction
        recurring_transaction = RecurringTransaction(
            amount=recurring_transaction_data.amount,
            description=recurring_transaction_data.description,
            notes=recurring_transaction_data.notes,
            frequency=recurring_transaction_data.frequency,
            start_date=recurring_transaction_data.start_date,
            end_date=recurring_transaction_data.end_date,
            next_execution_date=next_execution_date,
            is_income=recurring_transaction_data.is_income,
            account_id=recurring_transaction_data.account_id,
            category_id=recurring_transaction_data.category_id
        )
        
        db.add(recurring_transaction)
        db.commit()
        db.refresh(recurring_transaction)
        return recurring_transaction
    
    @staticmethod
    def update_recurring_transaction(
        db: Session, 
        recurring_transaction_id: str, 
        recurring_transaction_data: RecurringTransactionUpdate
    ) -> Optional[RecurringTransaction]:
        """
        Update an existing recurring transaction.
        """
        recurring_transaction = db.query(RecurringTransaction).filter(
            RecurringTransaction.id == recurring_transaction_id
        ).first()
        if not recurring_transaction:
            return None
        
        # Update fields
        update_data = recurring_transaction_data.dict(exclude_unset=True)
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
            
            setattr(recurring_transaction, field, value)
        
        # Recalculate next execution date if frequency or start date changed
        if 'frequency' in update_data or 'start_date' in update_data:
            recurring_transaction.next_execution_date = RecurringTransactionService._calculate_next_execution_date(
                recurring_transaction.start_date,
                recurring_transaction.frequency
            )
        
        db.commit()
        db.refresh(recurring_transaction)
        return recurring_transaction
    
    @staticmethod
    def delete_recurring_transaction(db: Session, recurring_transaction_id: str) -> bool:
        """
        Soft delete a recurring transaction by setting is_active=False.
        """
        recurring_transaction = db.query(RecurringTransaction).filter(
            RecurringTransaction.id == recurring_transaction_id
        ).first()
        if not recurring_transaction:
            return False
        
        recurring_transaction.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def generate_transaction(db: Session, recurring_transaction_id: str) -> Optional[Transaction]:
        """
        Manually generate a transaction from a recurring transaction.
        """
        recurring_transaction = db.query(RecurringTransaction).filter(
            RecurringTransaction.id == recurring_transaction_id,
            RecurringTransaction.is_active == True
        ).first()
        
        if not recurring_transaction:
            return None
        
        # Check if end date has passed
        if (recurring_transaction.end_date and 
            datetime.now() > recurring_transaction.end_date):
            raise ValueError("Recurring transaction has ended")
        
        # Create transaction
        transaction = Transaction(
            amount=recurring_transaction.amount,
            description=recurring_transaction.description,
            notes=recurring_transaction.notes,
            transaction_date=recurring_transaction.next_execution_date,
            is_income=recurring_transaction.is_income,
            account_id=recurring_transaction.account_id,
            category_id=recurring_transaction.category_id,
            recurring_transaction_id=recurring_transaction.id
        )
        
        db.add(transaction)
        
        # Update next execution date
        recurring_transaction.next_execution_date = RecurringTransactionService._calculate_next_execution_date(
            recurring_transaction.next_execution_date,
            recurring_transaction.frequency
        )
        
        db.commit()
        db.refresh(transaction)
        
        # Update account balance
        from .account import AccountService
        account = db.query(Account).filter(Account.id == transaction.account_id).first()
        if account:
            AccountService._update_account_balance(db, account)
        
        return transaction
    
    @staticmethod
    def process_due_recurring_transactions(db: Session) -> int:
        """
        Process all due recurring transactions (generate transactions for them).
        """
        now = datetime.now()
        
        # Get all active recurring transactions that are due
        due_recurring_transactions = db.query(RecurringTransaction).filter(
            and_(
                RecurringTransaction.is_active == True,
                RecurringTransaction.next_execution_date <= now,
                or_(
                    RecurringTransaction.end_date.is_(None),
                    RecurringTransaction.end_date > now
                )
            )
        ).all()
        
        processed_count = 0
        for recurring_transaction in due_recurring_transactions:
            try:
                RecurringTransactionService.generate_transaction(db, str(recurring_transaction.id))
                processed_count += 1
            except Exception as e:
                # Log error but continue processing others
                print(f"Error processing recurring transaction {recurring_transaction.id}: {e}")
                continue
        
        return processed_count
    
    @staticmethod
    def _calculate_next_execution_date(base_date: datetime, frequency: FrequencyType) -> datetime:
        """
        Calculate the next execution date based on frequency.
        """
        if frequency == FrequencyType.DAILY:
            return base_date + timedelta(days=1)
        elif frequency == FrequencyType.WEEKLY:
            return base_date + timedelta(weeks=1)
        elif frequency == FrequencyType.BIWEEKLY:
            return base_date + timedelta(weeks=2)
        elif frequency == FrequencyType.MONTHLY:
            return base_date + relativedelta(months=1)
        elif frequency == FrequencyType.QUARTERLY:
            return base_date + relativedelta(months=3)
        elif frequency == FrequencyType.YEARLY:
            return base_date + relativedelta(years=1)
        else:
            raise ValueError(f"Unsupported frequency: {frequency}")
    
    @staticmethod
    def get_upcoming_recurring_transactions(
        db: Session, 
        days_ahead: int = 30
    ) -> List[RecurringTransaction]:
        """
        Get recurring transactions that will be due in the next N days.
        """
        end_date = datetime.now() + timedelta(days=days_ahead)
        
        return db.query(RecurringTransaction).filter(
            and_(
                RecurringTransaction.is_active == True,
                RecurringTransaction.next_execution_date <= end_date,
                or_(
                    RecurringTransaction.end_date.is_(None),
                    RecurringTransaction.end_date > datetime.now()
                )
            )
        ).order_by(RecurringTransaction.next_execution_date).all() 