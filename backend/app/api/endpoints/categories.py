from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.auth import get_current_user
from ...schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from ...services.category_service import (
    get_categories,
    get_category_by_id,
    create_category,
    update_category,
    delete_category,
    create_predefined_categories
)
import uuid

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all categories."""
    return get_categories(db, skip=skip, limit=limit)


@router.get("/{category_id}", response_model=CategoryResponse)
async def read_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get a specific category by ID."""
    category = get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_new_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create a new category."""
    return create_category(db, category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_existing_category(
    category_id: uuid.UUID,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update an existing category."""
    category = update_category(db, category_id, category_update)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}")
async def delete_existing_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete a category."""
    if not delete_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found or cannot be deleted")
    return {"message": "Category deleted successfully"}


@router.post("/seed")
async def seed_predefined_categories(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create predefined categories."""
    created_categories = create_predefined_categories(db)
    return {"message": f"Created {len(created_categories)} predefined categories"}