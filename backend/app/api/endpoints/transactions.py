from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionFilter
from ...services.transaction import TransactionService

router = APIRouter()


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    is_income: Optional[bool] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get transactions with optional filtering.
    """
    filters = TransactionFilter(
        account_id=account_id,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        is_income=is_income,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search
    )
    
    transactions = TransactionService.get_transactions(db, filters, skip, limit)
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get a specific transaction by ID.
    """
    transaction = TransactionService.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction


@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new transaction.
    """
    try:
        return TransactionService.create_transaction(db, transaction_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing transaction.
    """
    try:
        transaction = TransactionService.update_transaction(db, transaction_id, transaction_data)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Delete a transaction.
    """
    success = TransactionService.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return {"message": "Transaction deleted successfully"}


@router.get("/summary/monthly")
async def get_monthly_summary(
    year: int = Query(..., ge=2000, le=3000),
    month: int = Query(..., ge=1, le=12),
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get monthly transaction summary.
    """
    summary = TransactionService.get_monthly_summary(db, year, month, account_id)
    return summary


@router.get("/summary/category")
async def get_category_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get transaction summary by category.
    """
    summary = TransactionService.get_category_summary(db, start_date, end_date, account_id)
    return summary 