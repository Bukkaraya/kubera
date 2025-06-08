from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.transfer import TransferCreate, TransferResponse
from ...services.transfer import TransferService

router = APIRouter()


@router.post("/", response_model=TransferResponse)
async def create_transfer(
    transfer_data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Create a transfer between accounts.
    """
    try:
        return TransferService.create_transfer(db, transfer_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[TransferResponse])
async def get_transfers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all transfers with pagination.
    """
    transfers = TransferService.get_transfers(db, skip=skip, limit=limit)
    return transfers


@router.get("/{transfer_id}", response_model=TransferResponse)
async def get_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get a specific transfer by ID.
    """
    transfer = TransferService.get_transfer(db, transfer_id)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found"
        )
    return transfer 