from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from decimal import Decimal
from datetime import datetime
from ..models.goal import Goal, GoalType, GoalStatus
from ..models.account import Account
from ..schemas.goal import GoalCreate, GoalUpdate, GoalProgressUpdate, GoalStats


class GoalService:
    
    @staticmethod
    def get_goals(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        account_id: Optional[str] = None,
        status: Optional[GoalStatus] = None,
        is_active: Optional[bool] = True
    ) -> List[Goal]:
        """
        Get goals with optional filtering.
        """
        query = db.query(Goal).options(joinedload(Goal.account))
        
        if account_id:
            query = query.filter(Goal.account_id == account_id)
        
        if status:
            query = query.filter(Goal.status == status)
            
        if is_active is not None:
            query = query.filter(Goal.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_goal(db: Session, goal_id: str) -> Optional[Goal]:
        """
        Get goal by ID.
        """
        return db.query(Goal).options(joinedload(Goal.account)).filter(
            Goal.id == goal_id, 
            Goal.is_active == True
        ).first()
    
    @staticmethod
    def create_goal(db: Session, goal_data: GoalCreate) -> Goal:
        """
        Create a new goal.
        """
        # Verify account exists
        account = db.query(Account).filter(Account.id == goal_data.account_id).first()
        if not account:
            raise ValueError(f"Account with ID {goal_data.account_id} not found")
        
        goal = Goal(
            name=goal_data.name,
            description=goal_data.description,
            goal_type=goal_data.goal_type,
            target_amount=goal_data.target_amount,
            target_date=goal_data.target_date,
            account_id=goal_data.account_id
        )
        
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def update_goal(db: Session, goal_id: str, goal_data: GoalUpdate) -> Optional[Goal]:
        """
        Update an existing goal.
        """
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        update_data = goal_data.dict(exclude_unset=True)
        
        # Auto-complete goals if conditions are met
        if 'current_amount' in update_data or 'status' in update_data:
            goal = GoalService._update_goal_fields(goal, update_data)
            GoalService._check_and_complete_goal(db, goal)
        else:
            for field, value in update_data.items():
                setattr(goal, field, value)
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def update_goal_progress(db: Session, goal_id: str, progress_data: GoalProgressUpdate) -> Optional[Goal]:
        """
        Update goal progress (current amount).
        """
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        goal.current_amount = progress_data.current_amount
        goal.updated_at = datetime.utcnow()
        
        # Check if goal should be completed
        GoalService._check_and_complete_goal(db, goal)
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def delete_goal(db: Session, goal_id: str) -> bool:
        """
        Soft delete a goal by setting is_active=False.
        """
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return False
        
        goal.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def complete_goal(db: Session, goal_id: str) -> Optional[Goal]:
        """
        Mark a goal as completed.
        """
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        goal.status = GoalStatus.COMPLETED
        goal.completed_at = datetime.utcnow()
        goal.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def get_goals_by_account(db: Session, account_id: str) -> List[Goal]:
        """
        Get all active goals for a specific account.
        """
        return db.query(Goal).filter(
            Goal.account_id == account_id,
            Goal.is_active == True
        ).all()
    
    @staticmethod
    def get_goal_stats(db: Session, account_id: Optional[str] = None) -> GoalStats:
        """
        Get goal statistics.
        """
        query = db.query(Goal)
        if account_id:
            query = query.filter(Goal.account_id == account_id)
        
        query = query.filter(Goal.is_active == True)
        
        goals = query.all()
        
        total_goals = len(goals)
        active_goals = len([g for g in goals if g.status == GoalStatus.ACTIVE])
        completed_goals = len([g for g in goals if g.status == GoalStatus.COMPLETED])
        
        # Calculate amounts (only for amount-based goals)
        amount_goals = [g for g in goals if g.target_amount is not None]
        total_target_amount = sum(g.target_amount for g in amount_goals)
        total_current_amount = sum(g.current_amount for g in amount_goals)
        
        overall_progress_percentage = 0.0
        if total_target_amount > 0:
            overall_progress_percentage = float(total_current_amount / total_target_amount) * 100
        
        return GoalStats(
            total_goals=total_goals,
            active_goals=active_goals,
            completed_goals=completed_goals,
            total_target_amount=total_target_amount,
            total_current_amount=total_current_amount,
            overall_progress_percentage=min(overall_progress_percentage, 100.0)
        )
    
    @staticmethod
    def _update_goal_fields(goal: Goal, update_data: dict) -> Goal:
        """
        Update goal fields with the provided data.
        """
        for field, value in update_data.items():
            setattr(goal, field, value)
        goal.updated_at = datetime.utcnow()
        return goal
    
    @staticmethod
    def _check_and_complete_goal(db: Session, goal: Goal) -> None:
        """
        Check if goal should be automatically completed and update status.
        """
        if goal.status == GoalStatus.COMPLETED:
            return
        
        should_complete = False
        
        # Goals should only be completed when target amount is reached
        if goal.goal_type == GoalType.AMOUNT and goal.target_amount:
            should_complete = goal.current_amount >= goal.target_amount
        elif goal.goal_type == GoalType.AMOUNT_DATE and goal.target_amount:
            should_complete = goal.current_amount >= goal.target_amount
        
        if should_complete:
            goal.status = GoalStatus.COMPLETED
            goal.completed_at = datetime.utcnow()
    
    @staticmethod
    def get_overdue_goals(db: Session) -> List[Goal]:
        """
        Get goals that are past their target date but not completed.
        """
        return db.query(Goal).filter(
            and_(
                Goal.target_date < datetime.utcnow(),
                Goal.status != GoalStatus.COMPLETED,
                Goal.is_active == True
            )
        ).all()
    
    @staticmethod
    def get_near_completion_goals(db: Session, threshold_percentage: float = 90.0) -> List[Goal]:
        """
        Get goals that are near completion (default: 90% of target amount).
        """
        goals = db.query(Goal).filter(
            and_(
                Goal.target_amount.isnot(None),
                Goal.status == GoalStatus.ACTIVE,
                Goal.is_active == True
            )
        ).all()
        
        near_completion = []
        for goal in goals:
            if goal.progress_percentage >= threshold_percentage:
                near_completion.append(goal)
        
        return near_completion 