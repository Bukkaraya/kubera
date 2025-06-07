from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models.account import Account, AccountType
from ...schemas.account import AccountCreate, AccountUpdate, AccountResponse
from ...services.account import AccountService

router = APIRouter()


@router.get("/", response_model=List[AccountResponse])
async def get_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all accounts with calculated balances.
    """
    accounts = AccountService.get_accounts(db, skip=skip, limit=limit)
    return accounts


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get a specific account by ID.
    """
    account = AccountService.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


@router.post("/", response_model=AccountResponse)
async def create_account(
    account_data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Create a new account.
    """
    return AccountService.create_account(db, account_data)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    account_data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing account.
    """
    account = AccountService.update_account(db, account_id, account_data)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account


@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Delete an account (soft delete by setting is_active=False).
    """
    success = AccountService.delete_account(db, account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return {"message": "Account deleted successfully"}


@router.get("/{account_id}/balance")
async def get_account_balance(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get current balance for a specific account.
    """
    balance = AccountService.get_account_balance(db, account_id)
    if balance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return {"account_id": account_id, "balance": balance} 