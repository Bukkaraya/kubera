from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.goal import GoalService
from ...schemas.goal import GoalCreate, GoalUpdate, GoalProgressUpdate, GoalResponse, GoalSummary, GoalStats
from ...models.goal import GoalStatus

router = APIRouter()


@router.get("/", response_model=List[GoalResponse])
def get_goals(
    skip: int = Query(0, ge=0, description="Number of goals to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of goals to return"),
    account_id: Optional[str] = Query(None, description="Filter by account ID"),
    status: Optional[GoalStatus] = Query(None, description="Filter by goal status"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get goals with optional filtering."""
    try:
        goals = GoalService.get_goals(
            db=db, 
            skip=skip, 
            limit=limit, 
            account_id=account_id, 
            status=status, 
            is_active=is_active
        )
        
        # Convert to response models with computed properties
        goal_responses = []
        for goal in goals:
            goal_dict = {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "goal_type": goal.goal_type,
                "status": goal.status,
                "target_amount": goal.target_amount,
                "target_date": goal.target_date,
                "current_amount": goal.current_amount,
                "account_id": goal.account_id,
                "is_active": goal.is_active,
                "created_at": goal.created_at,
                "updated_at": goal.updated_at,
                "completed_at": goal.completed_at,
                "progress_percentage": goal.progress_percentage,
                "remaining_amount": goal.remaining_amount,
                "days_remaining": goal.days_remaining,
                "is_completed": goal.is_completed
            }
            goal_responses.append(GoalResponse(**goal_dict))
        
        return goal_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=GoalStats)
def get_goal_stats(
    account_id: Optional[str] = Query(None, description="Get stats for specific account"),
    db: Session = Depends(get_db)
):
    """Get goal statistics."""
    try:
        return GoalService.get_goal_stats(db=db, account_id=account_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overdue", response_model=List[GoalResponse])
def get_overdue_goals(db: Session = Depends(get_db)):
    """Get goals that are past their target date but not completed."""
    try:
        goals = GoalService.get_overdue_goals(db=db)
        
        goal_responses = []
        for goal in goals:
            goal_dict = {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "goal_type": goal.goal_type,
                "status": goal.status,
                "target_amount": goal.target_amount,
                "target_date": goal.target_date,
                "current_amount": goal.current_amount,
                "account_id": goal.account_id,
                "is_active": goal.is_active,
                "created_at": goal.created_at,
                "updated_at": goal.updated_at,
                "completed_at": goal.completed_at,
                "progress_percentage": goal.progress_percentage,
                "remaining_amount": goal.remaining_amount,
                "days_remaining": goal.days_remaining,
                "is_completed": goal.is_completed
            }
            goal_responses.append(GoalResponse(**goal_dict))
        
        return goal_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/near-completion", response_model=List[GoalResponse])
def get_near_completion_goals(
    threshold: float = Query(90.0, ge=0, le=100, description="Completion threshold percentage"),
    db: Session = Depends(get_db)
):
    """Get goals that are near completion."""
    try:
        goals = GoalService.get_near_completion_goals(db=db, threshold_percentage=threshold)
        
        goal_responses = []
        for goal in goals:
            goal_dict = {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "goal_type": goal.goal_type,
                "status": goal.status,
                "target_amount": goal.target_amount,
                "target_date": goal.target_date,
                "current_amount": goal.current_amount,
                "account_id": goal.account_id,
                "is_active": goal.is_active,
                "created_at": goal.created_at,
                "updated_at": goal.updated_at,
                "completed_at": goal.completed_at,
                "progress_percentage": goal.progress_percentage,
                "remaining_amount": goal.remaining_amount,
                "days_remaining": goal.days_remaining,
                "is_completed": goal.is_completed
            }
            goal_responses.append(GoalResponse(**goal_dict))
        
        return goal_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    """Get goal by ID."""
    goal = GoalService.get_goal(db=db, goal_id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal_dict = {
        "id": goal.id,
        "name": goal.name,
        "description": goal.description,
        "goal_type": goal.goal_type,
        "status": goal.status,
        "target_amount": goal.target_amount,
        "target_date": goal.target_date,
        "current_amount": goal.current_amount,
        "account_id": goal.account_id,
        "is_active": goal.is_active,
        "created_at": goal.created_at,
        "updated_at": goal.updated_at,
        "completed_at": goal.completed_at,
        "progress_percentage": goal.progress_percentage,
        "remaining_amount": goal.remaining_amount,
        "days_remaining": goal.days_remaining,
        "is_completed": goal.is_completed
    }
    return GoalResponse(**goal_dict)


@router.post("/", response_model=GoalResponse)
def create_goal(goal_data: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal."""
    try:
        goal = GoalService.create_goal(db=db, goal_data=goal_data)
        
        goal_dict = {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "status": goal.status,
            "target_amount": goal.target_amount,
            "target_date": goal.target_date,
            "current_amount": goal.current_amount,
            "account_id": goal.account_id,
            "is_active": goal.is_active,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "completed_at": goal.completed_at,
            "progress_percentage": goal.progress_percentage,
            "remaining_amount": goal.remaining_amount,
            "days_remaining": goal.days_remaining,
            "is_completed": goal.is_completed
        }
        return GoalResponse(**goal_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: str, goal_data: GoalUpdate, db: Session = Depends(get_db)):
    """Update a goal."""
    try:
        goal = GoalService.update_goal(db=db, goal_id=goal_id, goal_data=goal_data)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        goal_dict = {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "status": goal.status,
            "target_amount": goal.target_amount,
            "target_date": goal.target_date,
            "current_amount": goal.current_amount,
            "account_id": goal.account_id,
            "is_active": goal.is_active,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "completed_at": goal.completed_at,
            "progress_percentage": goal.progress_percentage,
            "remaining_amount": goal.remaining_amount,
            "days_remaining": goal.days_remaining,
            "is_completed": goal.is_completed
        }
        return GoalResponse(**goal_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{goal_id}/progress", response_model=GoalResponse)
def update_goal_progress(goal_id: str, progress_data: GoalProgressUpdate, db: Session = Depends(get_db)):
    """Update goal progress (current amount)."""
    try:
        goal = GoalService.update_goal_progress(db=db, goal_id=goal_id, progress_data=progress_data)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        goal_dict = {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "status": goal.status,
            "target_amount": goal.target_amount,
            "target_date": goal.target_date,
            "current_amount": goal.current_amount,
            "account_id": goal.account_id,
            "is_active": goal.is_active,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "completed_at": goal.completed_at,
            "progress_percentage": goal.progress_percentage,
            "remaining_amount": goal.remaining_amount,
            "days_remaining": goal.days_remaining,
            "is_completed": goal.is_completed
        }
        return GoalResponse(**goal_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{goal_id}/complete", response_model=GoalResponse)
def complete_goal(goal_id: str, db: Session = Depends(get_db)):
    """Mark a goal as completed."""
    try:
        goal = GoalService.complete_goal(db=db, goal_id=goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        goal_dict = {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "status": goal.status,
            "target_amount": goal.target_amount,
            "target_date": goal.target_date,
            "current_amount": goal.current_amount,
            "account_id": goal.account_id,
            "is_active": goal.is_active,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "completed_at": goal.completed_at,
            "progress_percentage": goal.progress_percentage,
            "remaining_amount": goal.remaining_amount,
            "days_remaining": goal.days_remaining,
            "is_completed": goal.is_completed
        }
        return GoalResponse(**goal_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    """Delete a goal."""
    success = GoalService.delete_goal(db=db, goal_id=goal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"} 