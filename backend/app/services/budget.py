from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, extract
from decimal import Decimal
from datetime import datetime, date
from ..models.budget import Budget
from ..models.category import Category
from ..models.transaction import Transaction
from ..schemas.budget import BudgetCreate, BudgetUpdate, BudgetAnalysis, BudgetSummary


class BudgetService:
    
    @staticmethod
    def get_budgets(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        year: Optional[int] = None,
        month: Optional[int] = None,
        category_id: Optional[str] = None
    ) -> List[Budget]:
        """
        Get budgets with optional filtering.
        """
        query = db.query(Budget).options(joinedload(Budget.category))
        
        if year:
            query = query.filter(Budget.period_year == year)
        
        if month:
            query = query.filter(Budget.period_month == month)
        
        if category_id:
            query = query.filter(Budget.category_id == category_id)
        
        budgets = query.offset(skip).limit(limit).all()
        
        # Update spent amounts for all budgets
        for budget in budgets:
            BudgetService._update_budget_spent_amount(db, budget)
        
        return budgets
    
    @staticmethod
    def get_budget(db: Session, budget_id: str) -> Optional[Budget]:
        """
        Get budget by ID with updated spent amount.
        """
        budget = db.query(Budget).options(joinedload(Budget.category)).filter(
            Budget.id == budget_id
        ).first()
        
        if budget:
            BudgetService._update_budget_spent_amount(db, budget)
        
        return budget
    
    @staticmethod
    def create_budget(db: Session, budget_data: BudgetCreate) -> Budget:
        """
        Create a new budget.
        """
        # Check if budget already exists for this category and period
        existing_budget = db.query(Budget).filter(
            and_(
                Budget.category_id == budget_data.category_id,
                Budget.period_year == budget_data.period_year,
                Budget.period_month == budget_data.period_month
            )
        ).first()
        
        if existing_budget:
            raise ValueError(f"Budget already exists for this category in {budget_data.period_year}-{budget_data.period_month:02d}")
        
        # Validate category exists
        category = db.query(Category).filter(Category.id == budget_data.category_id).first()
        if not category:
            raise ValueError("Category not found")
        
        # Create budget
        budget = Budget(
            name=budget_data.name,
            amount=budget_data.amount,
            period_year=budget_data.period_year,
            period_month=budget_data.period_month,
            category_id=budget_data.category_id
        )
        
        db.add(budget)
        db.commit()
        db.refresh(budget)
        
        # Calculate initial spent amount
        BudgetService._update_budget_spent_amount(db, budget)
        
        return budget
    
    @staticmethod
    def update_budget(db: Session, budget_id: str, budget_data: BudgetUpdate) -> Optional[Budget]:
        """
        Update an existing budget.
        """
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return None
        
        update_data = budget_data.dict(exclude_unset=True)
        
        # Check for duplicate if category or period is being changed
        if 'category_id' in update_data or 'period_year' in update_data or 'period_month' in update_data:
            new_category_id = update_data.get('category_id', budget.category_id)
            new_year = update_data.get('period_year', budget.period_year)
            new_month = update_data.get('period_month', budget.period_month)
            
            existing_budget = db.query(Budget).filter(
                and_(
                    Budget.id != budget_id,
                    Budget.category_id == new_category_id,
                    Budget.period_year == new_year,
                    Budget.period_month == new_month
                )
            ).first()
            
            if existing_budget:
                raise ValueError(f"Budget already exists for this category in {new_year}-{new_month:02d}")
        
        # Validate category if being changed
        if 'category_id' in update_data:
            category = db.query(Category).filter(Category.id == update_data['category_id']).first()
            if not category:
                raise ValueError("Category not found")
        
        # Update fields
        for field, value in update_data.items():
            setattr(budget, field, value)
        
        db.commit()
        db.refresh(budget)
        
        # Recalculate spent amount if period changed
        if 'period_year' in update_data or 'period_month' in update_data:
            BudgetService._update_budget_spent_amount(db, budget)
        
        return budget
    
    @staticmethod
    def delete_budget(db: Session, budget_id: str) -> bool:
        """
        Delete a budget.
        """
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return False
        
        db.delete(budget)
        db.commit()
        return True
    
    @staticmethod
    def get_budget_analysis(db: Session, year: int, month: int) -> BudgetAnalysis:
        """
        Get comprehensive budget analysis for a specific month and year.
        """
        budgets = db.query(Budget).options(joinedload(Budget.category)).filter(
            and_(
                Budget.period_year == year,
                Budget.period_month == month
            )
        ).all()
        
        # Update spent amounts for all budgets
        for budget in budgets:
            BudgetService._update_budget_spent_amount(db, budget)
        
        # Calculate totals
        total_budgeted = sum(budget.amount for budget in budgets)
        total_spent = sum(budget.spent_amount for budget in budgets)
        total_remaining = total_budgeted - total_spent
        overall_percentage_used = (total_spent / total_budgeted * 100) if total_budgeted > 0 else 0
        over_budget_count = sum(1 for budget in budgets if budget.spent_amount > budget.amount)
        
        # Create budget summaries
        budget_summaries = []
        for budget in budgets:
            budget_summaries.append(BudgetSummary(
                id=str(budget.id),
                name=budget.name,
                amount=budget.amount,
                spent_amount=budget.spent_amount,
                remaining_amount=budget.remaining_amount,
                percentage_used=budget.percentage_used,
                category_name=budget.category.name,
                is_over_budget=budget.spent_amount > budget.amount
            ))
        
        return BudgetAnalysis(
            year=year,
            month=month,
            total_budgeted=total_budgeted,
            total_spent=total_spent,
            total_remaining=total_remaining,
            overall_percentage_used=overall_percentage_used,
            budgets_count=len(budgets),
            over_budget_count=over_budget_count,
            budgets=budget_summaries
        )
    
    @staticmethod
    def refresh_spent_amounts(
        db: Session, 
        year: Optional[int] = None, 
        month: Optional[int] = None
    ) -> int:
        """
        Refresh spent amounts for budgets by recalculating from transactions.
        """
        query = db.query(Budget)
        
        if year:
            query = query.filter(Budget.period_year == year)
        
        if month:
            query = query.filter(Budget.period_month == month)
        
        budgets = query.all()
        
        for budget in budgets:
            BudgetService._update_budget_spent_amount(db, budget)
        
        return len(budgets)
    
    @staticmethod
    def _update_budget_spent_amount(db: Session, budget: Budget) -> None:
        """
        Update budget's spent amount based on transactions.
        """
        # Calculate spent amount from transactions in the budget period
        spent_amount = db.query(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).filter(
            and_(
                Transaction.category_id == budget.category_id,
                Transaction.is_income == False,  # Only expenses
                extract('year', Transaction.transaction_date) == budget.period_year,
                extract('month', Transaction.transaction_date) == budget.period_month
            )
        ).scalar()
        
        budget.spent_amount = Decimal(str(spent_amount))
        db.commit() 