from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetAnalysis
from ...services.budget import BudgetService

router = APIRouter()


@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    year: Optional[int] = Query(None, ge=2000, le=3000),
    month: Optional[int] = Query(None, ge=1, le=12),
    category_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get budgets with optional filtering by year, month, and category.
    """
    budgets = BudgetService.get_budgets(
        db, skip=skip, limit=limit, year=year, month=month, category_id=category_id
    )
    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get a specific budget by ID.
    """
    budget = BudgetService.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    return budget


@router.post("/", response_model=BudgetResponse)
async def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new budget.
    """
    try:
        return BudgetService.create_budget(db, budget_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing budget.
    """
    try:
        budget = BudgetService.update_budget(db, budget_id, budget_data)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        return budget
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Delete a budget.
    """
    success = BudgetService.delete_budget(db, budget_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    return {"message": "Budget deleted successfully"}


@router.get("/analysis/{year}/{month}", response_model=BudgetAnalysis)
async def get_budget_analysis(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get budget analysis for a specific month and year.
    """
    analysis = BudgetService.get_budget_analysis(db, year, month)
    return analysis


@router.post("/refresh-spent-amounts")
async def refresh_budget_spent_amounts(
    year: Optional[int] = Query(None, ge=2000, le=3000),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Refresh spent amounts for budgets by recalculating from transactions.
    """
    updated_count = BudgetService.refresh_spent_amounts(db, year, month)
    return {
        "message": f"Updated {updated_count} budgets",
        "count": updated_count
    }


@router.get("/current/summary")
async def get_current_month_budget_summary(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get budget summary for the current month.
    """
    now = datetime.now()
    analysis = BudgetService.get_budget_analysis(db, now.year, now.month)
    return analysis 