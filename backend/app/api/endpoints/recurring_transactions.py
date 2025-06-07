from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.recurring_transaction import (
    RecurringTransactionCreate, 
    RecurringTransactionUpdate, 
    RecurringTransactionResponse
)
from ...services.recurring_transaction import RecurringTransactionService

router = APIRouter()


@router.get("/", response_model=List[RecurringTransactionResponse])
async def get_recurring_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    account_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all recurring transactions with optional filtering.
    """
    recurring_transactions = RecurringTransactionService.get_recurring_transactions(
        db, skip=skip, limit=limit, is_active=is_active, 
        account_id=account_id, category_id=category_id
    )
    return recurring_transactions


@router.get("/{recurring_transaction_id}", response_model=RecurringTransactionResponse)
async def get_recurring_transaction(
    recurring_transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get a specific recurring transaction by ID.
    """
    recurring_transaction = RecurringTransactionService.get_recurring_transaction(
        db, recurring_transaction_id
    )
    if not recurring_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring transaction not found"
        )
    return recurring_transaction


@router.post("/", response_model=RecurringTransactionResponse)
async def create_recurring_transaction(
    recurring_transaction_data: RecurringTransactionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new recurring transaction.
    """
    try:
        return RecurringTransactionService.create_recurring_transaction(
            db, recurring_transaction_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{recurring_transaction_id}", response_model=RecurringTransactionResponse)
async def update_recurring_transaction(
    recurring_transaction_id: str,
    recurring_transaction_data: RecurringTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing recurring transaction.
    """
    try:
        recurring_transaction = RecurringTransactionService.update_recurring_transaction(
            db, recurring_transaction_id, recurring_transaction_data
        )
        if not recurring_transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurring transaction not found"
            )
        return recurring_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{recurring_transaction_id}")
async def delete_recurring_transaction(
    recurring_transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Delete a recurring transaction (soft delete by setting is_active=False).
    """
    success = RecurringTransactionService.delete_recurring_transaction(
        db, recurring_transaction_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring transaction not found"
        )
    return {"message": "Recurring transaction deleted successfully"}


@router.post("/{recurring_transaction_id}/generate")
async def generate_transaction(
    recurring_transaction_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Manually generate a transaction from a recurring transaction.
    """
    try:
        transaction = RecurringTransactionService.generate_transaction(
            db, recurring_transaction_id
        )
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurring transaction not found"
            )
        return {"message": "Transaction generated successfully", "transaction_id": str(transaction.id)}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/process-due")
async def process_due_recurring_transactions(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Process all due recurring transactions (generate transactions for them).
    """
    processed_count = RecurringTransactionService.process_due_recurring_transactions(db)
    return {
        "message": f"Processed {processed_count} recurring transactions",
        "count": processed_count
    } 