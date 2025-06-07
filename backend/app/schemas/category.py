from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    is_predefined: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True