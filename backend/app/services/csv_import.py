import csv
import io
import re
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy.orm import Session

from ..models.transaction import Transaction
from ..models.account import Account
from ..models.category import Category
from ..schemas.transaction import (
    CSVTransactionRow, 
    CSVUploadRequest, 
    CSVUploadResponse, 
    CSVTransactionError,
    CSVPreviewRow,
    CSVPreviewResponse,
    TransactionCreate
)
from ..services.transaction import TransactionService


class CSVImportService:
    """Service for handling CSV transaction imports"""
    
    # Credit card number patterns to remove
    CC_PATTERNS = [
        r'\b\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4}\b',  # 16-digit cards
        r'\b\d{4}[\s-]*\d{6}[\s-]*\d{5}\b',             # 15-digit Amex
        r'\b\d{4}[\s-]*\d{4}[\s-]*\d{4}\b',             # 12-digit cards
        r'\b\d{4}\*{8,12}\d{4}\b',                       # Masked format like 4500********0132
        r'<cc_number>',                                  # Placeholder format
        r'\*{4,}',                                       # Masked numbers
    ]
    
    @staticmethod
    def detect_delimiter(csv_content: str) -> str:
        """Detect the delimiter used in CSV (comma, tab, semicolon)"""
        sample = csv_content[:1000]  # Check first 1000 chars
        
        delimiters = ['\t', ',', ';', '|']
        delimiter_counts = {}
        
        for delimiter in delimiters:
            delimiter_counts[delimiter] = sample.count(delimiter)
        
        # Return the delimiter with highest count
        return max(delimiter_counts, key=delimiter_counts.get)
    
    @staticmethod
    def remove_credit_card_numbers(text: str) -> str:
        """Remove credit card numbers from text using regex patterns"""
        cleaned_text = text
        for pattern in CSVImportService.CC_PATTERNS:
            cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        return cleaned_text
    
    @staticmethod
    def parse_date(date_str: str, date_format: str = "%Y-%m-%d") -> Optional[datetime]:
        """Parse date string to datetime object"""
        try:
            # Clean the date string
            date_str = date_str.strip()
            return datetime.strptime(date_str, date_format)
        except ValueError:
            # Try common date formats if default fails
            common_formats = [
                "%Y-%m-%d",
                "%m/%d/%Y",
                "%d/%m/%Y",
                "%Y/%m/%d",
                "%m-%d-%Y",
                "%d-%m-%Y"
            ]
            
            for fmt in common_formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            return None
    
    @staticmethod
    def parse_amount(amount_str: str) -> Optional[Decimal]:
        """Parse amount string to Decimal"""
        try:
            # Clean the amount string
            amount_str = amount_str.strip()
            # Remove currency symbols and spaces
            amount_str = re.sub(r'[^\d.-]', '', amount_str)
            
            if not amount_str:
                return None
                
            return Decimal(amount_str)
        except (InvalidOperation, ValueError):
            return None
    
    @staticmethod
    def validate_accounts_and_categories(
        db: Session, 
        account_id: str, 
        category_id: str
    ) -> Tuple[bool, str]:
        """Validate that account and category exist"""
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return False, f"Account with ID {account_id} not found"
        
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            return False, f"Category with ID {category_id} not found"
        
        return True, "Valid"
    
    @staticmethod
    def parse_csv_content(
        csv_content: str,
        upload_request: CSVUploadRequest
    ) -> Tuple[List[CSVTransactionRow], List[CSVTransactionError]]:
        """Parse CSV content into transaction rows"""
        delimiter = CSVImportService.detect_delimiter(csv_content)
        
        csv_reader = csv.reader(io.StringIO(csv_content), delimiter=delimiter)
        rows = list(csv_reader)
        
        if not rows:
            return [], [CSVTransactionError(
                row_number=0,
                error_message="CSV file is empty",
                raw_data=""
            )]
        
        transaction_rows = []
        errors = []
        start_row = 1 if upload_request.skip_header else 0
        
        for row_num, row in enumerate(rows[start_row:], start=start_row + 1):
            try:
                # Skip empty rows
                if not any(cell.strip() for cell in row if cell):
                    continue
                
                # Ensure we have at least 5 columns (date, payee, expense, income, cc)
                if len(row) < 5:
                    errors.append(CSVTransactionError(
                        row_number=row_num,
                        error_message="Row has insufficient columns (need at least date, payee, expense, income, cc_number)",
                        raw_data=delimiter.join(row)
                    ))
                    continue
                
                # Extract and clean data
                date_str = row[0].strip()
                payee = CSVImportService.remove_credit_card_numbers(row[1].strip())
                expense_str = row[2].strip() if len(row) > 2 else ""
                income_str = row[3].strip() if len(row) > 3 else ""
                
                # Determine amount and transaction type
                amount_str = ""
                is_income = False
                
                if expense_str and expense_str != "":
                    amount_str = expense_str
                    is_income = False
                elif income_str and income_str != "":
                    amount_str = income_str
                    is_income = True
                else:
                    errors.append(CSVTransactionError(
                        row_number=row_num,
                        error_message="No amount found in expense (col 3) or income (col 4) columns",
                        raw_data=delimiter.join(row)
                    ))
                    continue
                
                if not date_str or not payee:
                    errors.append(CSVTransactionError(
                        row_number=row_num,
                        error_message="Missing required data (date or payee)",
                        raw_data=delimiter.join(row)
                    ))
                    continue
                
                transaction_row = CSVTransactionRow(
                    transaction_date=date_str,
                    payee=payee,
                    amount=amount_str,
                    raw_row=delimiter.join(row),
                    row_number=row_num
                )
                transaction_rows.append(transaction_row)
                
            except Exception as e:
                errors.append(CSVTransactionError(
                    row_number=row_num,
                    error_message=f"Error parsing row: {str(e)}",
                    raw_data=delimiter.join(row) if row else ""
                ))
        
        return transaction_rows, errors
    
    @staticmethod
    def create_transactions_from_csv(
        db: Session,
        csv_rows: List[CSVTransactionRow],
        upload_request: CSVUploadRequest
    ) -> Tuple[List[str], List[CSVTransactionError]]:
        """Create Transaction objects from validated CSV rows"""
        imported_ids = []
        errors = []
        
        for csv_row in csv_rows:
            try:
                # Parse date
                parsed_date = CSVImportService.parse_date(
                    csv_row.transaction_date, 
                    upload_request.date_format
                )
                if not parsed_date:
                    errors.append(CSVTransactionError(
                        row_number=csv_row.row_number or 0,
                        error_message=f"Invalid date format: {csv_row.transaction_date}",
                        raw_data=csv_row.raw_row
                    ))
                    continue
                
                # Parse amount
                parsed_amount = CSVImportService.parse_amount(csv_row.amount)
                if parsed_amount is None:
                    errors.append(CSVTransactionError(
                        row_number=csv_row.row_number or 0,
                        error_message=f"Invalid amount format: {csv_row.amount}",
                        raw_data=csv_row.raw_row
                    ))
                    continue
                
                # Re-parse the raw row to determine if it's income or expense
                # This is needed because CSVTransactionRow doesn't store the is_income flag
                row_parts = csv_row.raw_row.split('\t') if csv_row.raw_row else []
                is_income = False
                
                if len(row_parts) >= 4:
                    expense_str = row_parts[2].strip() if len(row_parts) > 2 else ""
                    income_str = row_parts[3].strip() if len(row_parts) > 3 else ""
                    
                    if income_str and income_str != "":
                        is_income = True
                    elif expense_str and expense_str != "":
                        is_income = False
                
                # For expenses, ensure amount is negative; for income, ensure positive
                if is_income:
                    parsed_amount = abs(parsed_amount)  # Income should be positive
                else:
                    parsed_amount = -abs(parsed_amount)  # Expenses should be negative
                
                # Determine category ID for this transaction
                category_id = upload_request.default_category_id
                if (upload_request.transaction_categories and 
                    csv_row.row_number and 
                    csv_row.row_number in upload_request.transaction_categories):
                    category_id = upload_request.transaction_categories[csv_row.row_number]
                
                # Create transaction
                transaction_data = TransactionCreate(
                    amount=parsed_amount,
                    payee=csv_row.payee,
                    notes=f"Imported from CSV - Row {csv_row.row_number}",
                    transaction_date=parsed_date,
                    is_income=is_income,
                    account_id=upload_request.account_id,
                    category_id=category_id
                )
                
                # Use the existing transaction service to create
                created_transaction = TransactionService.create_transaction(db, transaction_data)
                imported_ids.append(created_transaction.id)
                
            except Exception as e:
                errors.append(CSVTransactionError(
                    row_number=csv_row.row_number or 0,
                    error_message=f"Error creating transaction: {str(e)}",
                    raw_data=csv_row.raw_row
                ))
        
        return imported_ids, errors
    
    @staticmethod
    def process_csv_upload(
        db: Session,
        csv_content: str,
        upload_request: CSVUploadRequest
    ) -> CSVUploadResponse:
        """Main method to process CSV upload"""
        try:
            # Validate account and category exist
            is_valid, validation_message = CSVImportService.validate_accounts_and_categories(
                db, upload_request.account_id, upload_request.default_category_id
            )
            
            if not is_valid:
                return CSVUploadResponse(
                    success=False,
                    total_rows=0,
                    successful_imports=0,
                    failed_imports=0,
                    errors=[CSVTransactionError(
                        row_number=0,
                        error_message=validation_message,
                        raw_data=""
                    )],
                    message=validation_message
                )
            
            # Parse CSV content
            csv_rows, parse_errors = CSVImportService.parse_csv_content(csv_content, upload_request)
            
            # Create transactions
            imported_ids, creation_errors = CSVImportService.create_transactions_from_csv(
                db, csv_rows, upload_request
            )
            
            # Combine all errors
            all_errors = parse_errors + creation_errors
            total_rows = len(csv_rows) + len(parse_errors)
            successful_imports = len(imported_ids)
            failed_imports = len(all_errors)
            
            # Commit the transaction
            db.commit()
            
            success = successful_imports > 0
            message = f"Processed {total_rows} rows. Successfully imported {successful_imports} transactions."
            if failed_imports > 0:
                message += f" {failed_imports} rows failed."
            
            return CSVUploadResponse(
                success=success,
                total_rows=total_rows,
                successful_imports=successful_imports,
                failed_imports=failed_imports,
                errors=all_errors,
                imported_transaction_ids=imported_ids,
                message=message
            )
            
        except Exception as e:
            db.rollback()
            return CSVUploadResponse(
                success=False,
                total_rows=0,
                successful_imports=0,
                failed_imports=1,
                errors=[CSVTransactionError(
                    row_number=0,
                    error_message=f"Unexpected error during processing: {str(e)}",
                    raw_data=""
                )],
                message=f"Upload failed: {str(e)}"
            )
    
    @staticmethod
    def preview_csv(
        csv_content: str,
        upload_request: CSVUploadRequest
    ) -> CSVPreviewResponse:
        """Preview CSV content before upload"""
        try:
            delimiter = CSVImportService.detect_delimiter(csv_content)
            csv_reader = csv.reader(io.StringIO(csv_content), delimiter=delimiter)
            rows = list(csv_reader)
            
            if not rows:
                return CSVPreviewResponse(
                    total_rows=0,
                    preview_rows=[],
                    has_header=False,
                    detected_format=f"delimiter: {repr(delimiter)}",
                    estimated_valid_rows=0,
                    validation_errors=["CSV file is empty"]
                )
            
            start_row = 1 if upload_request.skip_header else 0
            preview_rows = []
            validation_errors = []
            valid_count = 0
            
            # Process up to 10 rows for preview
            for row_num, row in enumerate(rows[start_row:start_row + 10], start=start_row + 1):
                if len(row) < 5:
                    continue
                
                date_str = row[0].strip()
                payee = CSVImportService.remove_credit_card_numbers(row[1].strip())
                expense_str = row[2].strip() if len(row) > 2 else ""
                income_str = row[3].strip() if len(row) > 3 else ""
                
                # Determine amount and type
                amount_str = ""
                is_income = False
                
                if expense_str and expense_str != "":
                    amount_str = expense_str
                    is_income = False
                elif income_str and income_str != "":
                    amount_str = income_str
                    is_income = True
                
                parsed_date = CSVImportService.parse_date(date_str, upload_request.date_format)
                parsed_amount = CSVImportService.parse_amount(amount_str) if amount_str else None
                
                errors = []
                is_valid = True
                
                if not parsed_date:
                    errors.append(f"Invalid date: {date_str}")
                    is_valid = False
                
                if parsed_amount is None:
                    errors.append(f"Invalid or missing amount: expense='{expense_str}', income='{income_str}'")
                    is_valid = False
                
                if not payee:
                    errors.append("Empty payee")
                    is_valid = False
                
                if is_valid:
                    valid_count += 1
                
                preview_rows.append(CSVPreviewRow(
                    row_number=row_num,
                    transaction_date=date_str,
                    payee=payee,
                    amount=parsed_amount or Decimal('0'),
                    parsed_date=parsed_date,
                    is_valid=is_valid,
                    errors=errors
                ))
            
            return CSVPreviewResponse(
                total_rows=len(rows) - (1 if upload_request.skip_header else 0),
                preview_rows=preview_rows,
                has_header=upload_request.skip_header,
                detected_format=f"delimiter: {repr(delimiter)}",
                estimated_valid_rows=valid_count,
                validation_errors=validation_errors
            )
            
        except Exception as e:
            return CSVPreviewResponse(
                total_rows=0,
                preview_rows=[],
                has_header=False,
                detected_format="unknown",
                estimated_valid_rows=0,
                validation_errors=[f"Error processing CSV: {str(e)}"]
            ) 