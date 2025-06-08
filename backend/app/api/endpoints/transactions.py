from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, date
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.transaction import (
    TransactionCreate, 
    TransactionUpdate, 
    TransactionResponse, 
    TransactionFilter,
    CSVUploadRequest,
    CSVUploadResponse,
    CSVPreviewResponse
)
from ...services.transaction import TransactionService
from ...services.csv_import import CSVImportService

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


@router.post("/upload-csv", response_model=CSVUploadResponse)
async def upload_csv(
    csv_file: UploadFile = File(..., description="CSV file containing transactions"),
    account_id: str = Form(..., description="Account ID to assign transactions to"),
    default_category_id: str = Form(..., description="Default category ID for transactions"),
    skip_header: bool = Form(False, description="Whether to skip the first row as header"),
    date_format: str = Form("%Y-%m-%d", description="Date format in CSV"),
    transaction_categories: Optional[str] = Form(None, description="JSON string of transaction categories mapping"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Upload and process CSV file containing transactions.
    
    Expected CSV format:
    - Column 1: Date (YYYY-MM-DD or other specified format)
    - Column 2: Payee/Description (credit card numbers will be removed automatically)
    - Column 3: Amount (positive number, will be converted to negative for expenses)
    - Additional columns will be ignored
    
    Supports tab-separated (.tsv) and comma-separated (.csv) files.
    """
    try:
        # Validate file type
        if not csv_file.filename or not (
            csv_file.filename.endswith('.csv') or 
            csv_file.filename.endswith('.tsv') or
            csv_file.content_type in ['text/csv', 'text/tab-separated-values', 'application/csv']
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a CSV or TSV file"
            )
        
        # Read file content
        csv_content = await csv_file.read()
        csv_text = csv_content.decode('utf-8')
        
        # Parse transaction categories if provided
        parsed_categories = None
        if transaction_categories:
            try:
                import json
                parsed_categories = json.loads(transaction_categories)
                # Convert string keys to integers
                parsed_categories = {int(k): v for k, v in parsed_categories.items()}
            except (json.JSONDecodeError, ValueError) as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transaction_categories JSON: {str(e)}"
                )
        
        # Create upload request
        upload_request = CSVUploadRequest(
            account_id=account_id,
            default_category_id=default_category_id,
            skip_header=skip_header,
            date_format=date_format,
            transaction_categories=parsed_categories
        )
        
        # Process the CSV
        result = CSVImportService.process_csv_upload(db, csv_text, upload_request)
        
        return result
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File encoding not supported. Please use UTF-8 encoded files."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV file: {str(e)}"
        )


@router.post("/preview-csv", response_model=CSVPreviewResponse)
async def preview_csv(
    csv_file: UploadFile = File(..., description="CSV file to preview"),
    skip_header: bool = Form(False, description="Whether to skip the first row as header"),
    date_format: str = Form("%Y-%m-%d", description="Date format in CSV"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Preview CSV file before uploading to check format and data validity.
    Returns the first 10 rows with validation status.
    """
    try:
        # Validate file type
        if not csv_file.filename or not (
            csv_file.filename.endswith('.csv') or 
            csv_file.filename.endswith('.tsv') or
            csv_file.content_type in ['text/csv', 'text/tab-separated-values', 'application/csv']
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a CSV or TSV file"
            )
        
        # Read file content
        csv_content = await csv_file.read()
        csv_text = csv_content.decode('utf-8')
        
        # Create preview request (using dummy IDs for preview)
        preview_request = CSVUploadRequest(
            account_id="preview",  # Dummy ID for preview
            default_category_id="preview",  # Dummy ID for preview
            skip_header=skip_header,
            date_format=date_format
        )
        
        # Get preview
        result = CSVImportService.preview_csv(csv_text, preview_request)
        
        return result
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File encoding not supported. Please use UTF-8 encoded files."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error previewing CSV file: {str(e)}"
        ) 