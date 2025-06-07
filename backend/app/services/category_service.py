from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryUpdate
import uuid


def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
    """Get all categories with pagination."""
    return db.query(Category).offset(skip).limit(limit).all()


def get_category_by_id(db: Session, category_id: uuid.UUID) -> Optional[Category]:
    """Get category by ID."""
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_name(db: Session, name: str) -> Optional[Category]:
    """Get category by name."""
    return db.query(Category).filter(Category.name == name).first()


def create_category(db: Session, category: CategoryCreate) -> Category:
    """Create a new category."""
    db_category = Category(
        name=category.name,
        description=category.description,
        is_predefined=False
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: uuid.UUID, category_update: CategoryUpdate) -> Optional[Category]:
    """Update an existing category."""
    db_category = get_category_by_id(db, category_id)
    if not db_category:
        return None
    
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: uuid.UUID) -> bool:
    """Delete a category."""
    db_category = get_category_by_id(db, category_id)
    if not db_category:
        return False
    
    # Don't allow deletion of predefined categories
    if db_category.is_predefined:
        return False
    
    db.delete(db_category)
    db.commit()
    return True


def create_predefined_categories(db: Session) -> List[Category]:
    """Create predefined categories."""
    predefined_categories = [
        {"name": "Food & Dining", "description": "Restaurants, groceries, cooking"},
        {"name": "Transportation", "description": "Gas, public transport, parking"},
        {"name": "Shopping", "description": "Clothing, electronics, misc purchases"},
        {"name": "Entertainment", "description": "Movies, games, subscriptions"},
        {"name": "Bills & Utilities", "description": "Electricity, water, internet, phone"},
        {"name": "Healthcare", "description": "Medical, dental, pharmacy"},
        {"name": "Education", "description": "Tuition, books, courses"},
        {"name": "Travel", "description": "Flights, hotels, vacation"},
        {"name": "Income", "description": "Salary, freelance, investments"},
        {"name": "Savings", "description": "Emergency fund, retirement"},
        {"name": "Other", "description": "Miscellaneous expenses"}
    ]
    
    created_categories = []
    for cat_data in predefined_categories:
        existing = get_category_by_name(db, cat_data["name"])
        if not existing:
            db_category = Category(
                name=cat_data["name"],
                description=cat_data["description"],
                is_predefined=True
            )
            db.add(db_category)
            created_categories.append(db_category)
    
    db.commit()
    return created_categories