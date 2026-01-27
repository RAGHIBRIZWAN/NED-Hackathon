"""
Competitive Programming API Routes
==================================
Contests, leaderboards, and ratings.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.contest import Contest, ContestParticipation, ContestProblem
from app.models.challenge import Submission
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class CreateContestRequest(BaseModel):
    """Request to create a contest."""
    title: str
    title_ur: Optional[str] = None
    description: str
    description_ur: Optional[str] = None
    problem_ids: List[str]
    start_time: datetime
    duration_minutes: int
    contest_type: str = "rated"
    is_public: bool = True
    max_participants: Optional[int] = None


class RegisterContestRequest(BaseModel):
    """Request to register for a contest."""
    contest_id: str


# ============ ELO Rating System ============

def calculate_elo_change(
    current_rating: int,
    opponent_rating: int,
    score: float,  # 1 for win, 0.5 for draw, 0 for loss
    k_factor: int = 32
) -> int:
    """Calculate ELO rating change."""
    expected = 1 / (1 + 10 ** ((opponent_rating - current_rating) / 400))
    change = k_factor * (score - expected)
    return int(round(change))


def calculate_contest_rating_change(
    current_rating: int,
    rank: int,
    total_participants: int,
    avg_rating: int
) -> int:
    """Calculate rating change based on contest performance."""
    # Expected rank based on rating difference
    expected_rank = total_participants * (1 / (1 + 10 ** ((current_rating - avg_rating) / 400)))
    
    # Performance score (0-1 based on rank)
    actual_score = 1 - (rank - 1) / max(total_participants - 1, 1)
    expected_score = 1 - (expected_rank - 1) / max(total_participants - 1, 1)
    
    # K-factor based on current rating
    if current_rating < 1200:
        k = 40
    elif current_rating < 1600:
        k = 32
    else:
        k = 24
    
    change = int(k * (actual_score - expected_score) * 2)
    return change


# ============ Routes ============

@router.get("/contests")
async def get_contests(
    status_filter: Optional[str] = None,  # upcoming, ongoing, completed
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get list of contests.
    """
    query = {}
    
    if status_filter:
        query["status"] = status_filter
    
    skip = (page - 1) * limit
    contests = await Contest.find(query).sort("-start_time").skip(skip).limit(limit).to_list()
    total = await Contest.find(query).count()
    
    return {
        "contests": [
            {
                "id": str(c.id),
                "title": c.title,
                "title_ur": c.title_ur,
                "description": c.description,
                "start_time": c.start_time,
                "end_time": c.end_time,
                "duration_minutes": c.duration_minutes,
                "contest_type": c.contest_type,
                "status": c.status,
                "registered_count": c.registered_count,
                "num_problems": len(c.problems)
            }
            for c in contests
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/contests/{contest_id}")
async def get_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get contest details.
    """
    contest = await Contest.get(contest_id)
    
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    # Check if user is registered
    participation = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    
    # Only show problems if contest has started or user is registered
    now = datetime.utcnow()
    show_problems = contest.start_time <= now or participation is not None
    
    response = {
        "id": str(contest.id),
        "title": contest.title,
        "title_ur": contest.title_ur,
        "description": contest.description,
        "description_ur": contest.description_ur,
        "start_time": contest.start_time,
        "end_time": contest.end_time,
        "duration_minutes": contest.duration_minutes,
        "contest_type": contest.contest_type,
        "difficulty": contest.difficulty,
        "status": contest.status,
        "scoring_type": contest.scoring_type,
        "registered_count": contest.registered_count,
        "is_registered": participation is not None,
        "user_rank": participation.rank if participation else None
    }
    
    if show_problems:
        response["problems"] = [
            {
                "order": chr(65 + p.order),  # A, B, C...
                "challenge_id": p.challenge_id,
                "points": p.points
            }
            for p in contest.problems
        ]
    
    return response


@router.post("/contests/{contest_id}/register")
async def register_for_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Register for a contest.
    """
    contest = await Contest.get(contest_id)
    
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    # Check if already registered
    existing = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered"
        )
    
    # Check if registration is open
    if contest.status != "upcoming":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed"
        )
    
    # Check max participants
    if contest.max_participants and contest.registered_count >= contest.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contest is full"
        )
    
    # Get user for rating
    user = await User.get(current_user["user_id"])
    
    # Create participation
    participation = ContestParticipation(
        user_id=current_user["user_id"],
        contest_id=contest_id,
        old_rating=user.rating
    )
    await participation.insert()
    
    # Update contest count
    contest.registered_count += 1
    await contest.save()
    
    return {"message": "Registered successfully"}


@router.get("/contests/{contest_id}/leaderboard")
async def get_contest_leaderboard(
    contest_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get contest leaderboard.
    """
    contest = await Contest.get(contest_id)
    
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    # Get participations sorted by score
    skip = (page - 1) * limit
    participations = await ContestParticipation.find(
        {"contest_id": contest_id}
    ).sort([
        ("total_points", -1),
        ("total_penalty", 1)
    ]).skip(skip).limit(limit).to_list()
    
    total = await ContestParticipation.find({"contest_id": contest_id}).count()
    
    # Get user details
    leaderboard = []
    for i, p in enumerate(participations):
        user = await User.get(p.user_id)
        leaderboard.append({
            "rank": skip + i + 1,
            "user_id": p.user_id,
            "username": user.username if user else "Unknown",
            "total_points": p.total_points,
            "total_penalty": p.total_penalty,
            "problems_solved": p.problems_solved,
            "rating": user.rating if user else 0,
            "rating_change": p.rating_change
        })
    
    return {
        "leaderboard": leaderboard,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/leaderboard/global")
async def get_global_leaderboard(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get global rating leaderboard.
    """
    skip = (page - 1) * limit
    users = await User.find(
        {"is_active": True}
    ).sort("-rating").skip(skip).limit(limit).to_list()
    
    total = await User.find({"is_active": True}).count()
    
    return {
        "leaderboard": [
            {
                "rank": skip + i + 1,
                "user_id": str(u.id),
                "username": u.username,
                "full_name": u.full_name,
                "rating": u.rating,
                "max_rating": u.max_rating,
                "level": u.level,
                "country": u.country,
                "institution": u.institution
            }
            for i, u in enumerate(users)
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/user/{user_id}/contests")
async def get_user_contest_history(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get user's contest participation history.
    """
    skip = (page - 1) * limit
    participations = await ContestParticipation.find(
        {"user_id": user_id}
    ).sort("-registered_at").skip(skip).limit(limit).to_list()
    
    history = []
    for p in participations:
        contest = await Contest.get(p.contest_id)
        if contest:
            history.append({
                "contest_id": p.contest_id,
                "contest_title": contest.title,
                "rank": p.rank,
                "problems_solved": p.problems_solved,
                "total_points": p.total_points,
                "old_rating": p.old_rating,
                "new_rating": p.new_rating,
                "rating_change": p.rating_change,
                "participated_at": p.started_at or p.registered_at
            })
    
    return {"history": history}


@router.post("/contests")
async def create_contest(
    request: CreateContestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new contest (Admin only).
    """
    user = await User.get(current_user["user_id"])
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Create problems list
    problems = [
        ContestProblem(
            challenge_id=pid,
            order=i,
            points=100
        )
        for i, pid in enumerate(request.problem_ids)
    ]
    
    # Create slug
    slug = request.title.lower().replace(" ", "-")
    
    contest = Contest(
        title=request.title,
        title_ur=request.title_ur,
        slug=slug,
        description=request.description,
        description_ur=request.description_ur,
        problems=problems,
        start_time=request.start_time,
        end_time=request.start_time + timedelta(minutes=request.duration_minutes),
        duration_minutes=request.duration_minutes,
        contest_type=request.contest_type,
        is_public=request.is_public,
        max_participants=request.max_participants,
        created_by=current_user["user_id"]
    )
    await contest.insert()
    
    return {
        "message": "Contest created",
        "contest_id": str(contest.id)
    }


@router.post("/contests/{contest_id}/finalize")
async def finalize_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Finalize contest and calculate ratings (Admin only).
    """
    user = await User.get(current_user["user_id"])
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    contest = await Contest.get(contest_id)
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    if contest.is_results_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results already published"
        )
    
    # Get all participations
    participations = await ContestParticipation.find(
        {"contest_id": contest_id}
    ).sort([
        ("total_points", -1),
        ("total_penalty", 1)
    ]).to_list()
    
    if not participations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No participants"
        )
    
    # Calculate average rating
    total_rating = sum(p.old_rating or 1000 for p in participations)
    avg_rating = total_rating // len(participations)
    
    # Calculate and apply rating changes
    for rank, p in enumerate(participations, 1):
        p.rank = rank
        
        if contest.contest_type == "rated":
            rating_change = calculate_contest_rating_change(
                p.old_rating or 1000,
                rank,
                len(participations),
                avg_rating
            )
            p.rating_change = rating_change
            p.new_rating = (p.old_rating or 1000) + rating_change
            
            # Update user rating
            participant_user = await User.get(p.user_id)
            if participant_user:
                participant_user.rating = p.new_rating
                participant_user.max_rating = max(participant_user.max_rating, p.new_rating)
                participant_user.stats.total_contests_participated += 1
                if rank == 1:
                    participant_user.stats.total_contests_won += 1
                await participant_user.save()
        
        await p.save()
    
    # Update contest status
    contest.status = "completed"
    contest.is_results_published = True
    await contest.save()
    
    return {"message": "Contest finalized", "participants": len(participations)}
