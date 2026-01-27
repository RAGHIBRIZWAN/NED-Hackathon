"""
Lessons API Routes
=================
Lesson content, progress tracking, and course management.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.lesson import Lesson, LessonProgress
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class LessonSummary(BaseModel):
    """Lesson summary for listing."""
    id: str
    title: str
    title_ur: Optional[str]
    slug: str
    description: str
    course_id: str
    module_id: str
    difficulty: str
    estimated_minutes: int
    xp_reward: int
    coin_reward: int
    has_mcq: bool
    has_challenge: bool


class LessonDetail(BaseModel):
    """Full lesson detail."""
    id: str
    title: str
    title_ur: Optional[str]
    description: str
    description_ur: Optional[str]
    content_blocks: List[dict]
    examples: List[dict]
    difficulty: str
    estimated_minutes: int
    prerequisites: List[str]
    xp_reward: int
    coin_reward: int


class ProgressUpdate(BaseModel):
    """Progress update request."""
    progress_percentage: int
    time_spent_seconds: int


# ============ Routes ============

@router.get("/courses")
async def get_courses():
    """
    Get all available courses.
    """
    return {
        "courses": [
            {
                "id": "python_basics",
                "name": "Python Fundamentals",
                "name_ur": "پائتھون کی بنیادی باتیں",
                "description": "Learn Python from scratch with interactive lessons",
                "description_ur": "انٹرایکٹو اسباق کے ساتھ شروع سے پائتھون سیکھیں",
                "language": "python",
                "total_lessons": 25,
                "difficulty": "beginner",
                "icon": "🐍"
            },
            {
                "id": "cpp_basics",
                "name": "C++ Fundamentals",
                "name_ur": "سی پلس پلس کی بنیادی باتیں",
                "description": "Master C++ programming with hands-on practice",
                "description_ur": "عملی مشق کے ساتھ سی پلس پلس پروگرامنگ میں مہارت حاصل کریں",
                "language": "cpp",
                "total_lessons": 30,
                "difficulty": "beginner",
                "icon": "⚡"
            },
            {
                "id": "javascript_basics",
                "name": "JavaScript Fundamentals",
                "name_ur": "جاوا اسکرپٹ کی بنیادی باتیں",
                "description": "Build dynamic web applications with JavaScript",
                "description_ur": "جاوا اسکرپٹ کے ساتھ متحرک ویب ایپلیکیشنز بنائیں",
                "language": "javascript",
                "total_lessons": 28,
                "difficulty": "beginner",
                "icon": "🌐"
            }
        ]
    }


@router.get("/courses/{course_id}/modules")
async def get_course_modules(course_id: str):
    """
    Get modules for a specific course.
    """
    modules = {
        "python_basics": [
            {"id": "intro", "name": "Introduction to Python", "name_ur": "پائتھون کا تعارف", "order": 1},
            {"id": "variables", "name": "Variables & Data Types", "name_ur": "متغیرات اور ڈیٹا کی اقسام", "order": 2},
            {"id": "operators", "name": "Operators", "name_ur": "آپریٹرز", "order": 3},
            {"id": "conditionals", "name": "Conditional Statements", "name_ur": "شرطی بیانات", "order": 4},
            {"id": "loops", "name": "Loops", "name_ur": "لوپس", "order": 5},
            {"id": "functions", "name": "Functions", "name_ur": "فنکشنز", "order": 6},
            {"id": "lists", "name": "Lists & Tuples", "name_ur": "فہرستیں اور ٹپلز", "order": 7},
            {"id": "dictionaries", "name": "Dictionaries", "name_ur": "ڈکشنریز", "order": 8},
            {"id": "strings", "name": "String Operations", "name_ur": "سٹرنگ آپریشنز", "order": 9},
            {"id": "files", "name": "File Handling", "name_ur": "فائل ہینڈلنگ", "order": 10},
        ],
        "cpp_basics": [
            {"id": "intro", "name": "Introduction to C++", "name_ur": "سی پلس پلس کا تعارف", "order": 1},
            {"id": "variables", "name": "Variables & Data Types", "name_ur": "متغیرات اور ڈیٹا کی اقسام", "order": 2},
            {"id": "operators", "name": "Operators", "name_ur": "آپریٹرز", "order": 3},
            {"id": "conditionals", "name": "Conditional Statements", "name_ur": "شرطی بیانات", "order": 4},
            {"id": "loops", "name": "Loops", "name_ur": "لوپس", "order": 5},
            {"id": "functions", "name": "Functions", "name_ur": "فنکشنز", "order": 6},
            {"id": "arrays", "name": "Arrays", "name_ur": "ارے", "order": 7},
            {"id": "pointers", "name": "Pointers", "name_ur": "پوائنٹرز", "order": 8},
            {"id": "strings", "name": "Strings", "name_ur": "سٹرنگز", "order": 9},
            {"id": "classes", "name": "Classes & Objects", "name_ur": "کلاسز اور آبجیکٹس", "order": 10},
        ],
        "javascript_basics": [
            {"id": "intro", "name": "Introduction to JavaScript", "name_ur": "جاوا اسکرپٹ کا تعارف", "order": 1},
            {"id": "variables", "name": "Variables & Data Types", "name_ur": "متغیرات اور ڈیٹا کی اقسام", "order": 2},
            {"id": "operators", "name": "Operators", "name_ur": "آپریٹرز", "order": 3},
            {"id": "conditionals", "name": "Conditional Statements", "name_ur": "شرطی بیانات", "order": 4},
            {"id": "loops", "name": "Loops", "name_ur": "لوپس", "order": 5},
            {"id": "functions", "name": "Functions", "name_ur": "فنکشنز", "order": 6},
            {"id": "arrays", "name": "Arrays", "name_ur": "ارے", "order": 7},
            {"id": "objects", "name": "Objects", "name_ur": "آبجیکٹس", "order": 8},
            {"id": "dom", "name": "DOM Manipulation", "name_ur": "ڈوم مینیپولیشن", "order": 9},
            {"id": "async", "name": "Async JavaScript", "name_ur": "ایسنک جاوا اسکرپٹ", "order": 10},
        ]
    }
    
    if course_id not in modules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return {"modules": modules[course_id]}


@router.get("/")
async def get_lessons(
    course_id: Optional[str] = None,
    module_id: Optional[str] = None,
    language: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get list of lessons with optional filtering.
    """
    query = {"is_published": True}
    
    if course_id:
        query["course_id"] = course_id
    if module_id:
        query["module_id"] = module_id
    if language:
        query["programming_language"] = language
    if difficulty:
        query["difficulty"] = difficulty
    
    skip = (page - 1) * limit
    
    lessons = await Lesson.find(query).skip(skip).limit(limit).to_list()
    total = await Lesson.find(query).count()
    
    return {
        "lessons": [
            {
                "id": str(lesson.id),
                "title": lesson.title,
                "title_ur": lesson.title_ur,
                "slug": lesson.slug,
                "description": lesson.description,
                "course_id": lesson.course_id,
                "module_id": lesson.module_id,
                "difficulty": lesson.difficulty,
                "estimated_minutes": lesson.estimated_minutes,
                "xp_reward": lesson.xp_reward,
                "coin_reward": lesson.coin_reward,
                "has_mcq": lesson.has_mcq,
                "has_challenge": lesson.has_challenge
            }
            for lesson in lessons
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{lesson_slug}")
async def get_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Get full lesson content by slug.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get user's progress for this lesson
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    return {
        "lesson": {
            "id": str(lesson.id),
            "title": lesson.title,
            "title_ur": lesson.title_ur,
            "slug": lesson.slug,
            "description": lesson.description,
            "description_ur": lesson.description_ur,
            "content_blocks": [block.dict() for block in lesson.content_blocks],
            "examples": [example.dict() for example in lesson.examples],
            "difficulty": lesson.difficulty,
            "estimated_minutes": lesson.estimated_minutes,
            "prerequisites": lesson.prerequisites,
            "has_mcq": lesson.has_mcq,
            "has_challenge": lesson.has_challenge,
            "challenge_id": lesson.challenge_id,
            "xp_reward": lesson.xp_reward,
            "coin_reward": lesson.coin_reward
        },
        "progress": progress.dict() if progress else None
    }


@router.post("/{lesson_slug}/start")
async def start_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a lesson as started and initialize progress.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if progress already exists
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if progress:
        progress.last_accessed_at = datetime.utcnow()
        await progress.save()
    else:
        progress = LessonProgress(
            user_id=current_user["user_id"],
            lesson_id=str(lesson.id),
            status="in_progress",
            started_at=datetime.utcnow()
        )
        await progress.insert()
    
    return {"message": "Lesson started", "progress": progress.dict()}


@router.put("/{lesson_slug}/progress")
async def update_lesson_progress(
    lesson_slug: str,
    request: ProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update progress for a lesson.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson not started"
        )
    
    progress.progress_percentage = min(request.progress_percentage, 100)
    progress.time_spent_seconds += request.time_spent_seconds
    progress.last_accessed_at = datetime.utcnow()
    
    await progress.save()
    
    return {"message": "Progress updated", "progress": progress.dict()}


@router.post("/{lesson_slug}/complete")
async def complete_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a lesson as completed and award rewards.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson not started"
        )
    
    # Check if already completed
    if progress.rewards_claimed:
        return {"message": "Lesson already completed", "rewards": None}
    
    # Update progress
    progress.status = "completed"
    progress.progress_percentage = 100
    progress.completed_at = datetime.utcnow()
    
    # Award rewards
    user = await User.get(current_user["user_id"])
    
    xp_earned = lesson.xp_reward
    coins_earned = lesson.coin_reward
    
    # Apply streak bonus
    if user.stats.current_streak >= 7:
        xp_earned = int(xp_earned * 1.5)
        coins_earned = int(coins_earned * 1.5)
    
    leveled_up = user.add_xp(xp_earned)
    user.add_coins(coins_earned)
    user.stats.total_lessons_completed += 1
    user.update_streak()
    
    await user.save()
    
    progress.xp_earned = xp_earned
    progress.coins_earned = coins_earned
    progress.rewards_claimed = True
    await progress.save()
    
    return {
        "message": "Lesson completed!",
        "rewards": {
            "xp": xp_earned,
            "coins": coins_earned,
            "leveled_up": leveled_up,
            "new_level": user.level if leveled_up else None
        }
    }


@router.get("/user/progress")
async def get_user_progress(
    current_user: dict = Depends(get_current_user),
    course_id: Optional[str] = None
):
    """
    Get user's overall learning progress.
    """
    # Get all user's progress
    progress_query = {"user_id": current_user["user_id"]}
    
    all_progress = await LessonProgress.find(progress_query).to_list()
    
    # Calculate stats
    completed_lessons = [p for p in all_progress if p.status == "completed"]
    in_progress_lessons = [p for p in all_progress if p.status == "in_progress"]
    
    total_time = sum(p.time_spent_seconds for p in all_progress)
    
    return {
        "total_lessons_started": len(all_progress),
        "completed_lessons": len(completed_lessons),
        "in_progress_lessons": len(in_progress_lessons),
        "total_time_spent_minutes": total_time // 60,
        "recent_lessons": [
            {
                "lesson_id": p.lesson_id,
                "status": p.status,
                "progress_percentage": p.progress_percentage,
                "last_accessed_at": p.last_accessed_at
            }
            for p in sorted(all_progress, key=lambda x: x.last_accessed_at, reverse=True)[:5]
        ]
    }
