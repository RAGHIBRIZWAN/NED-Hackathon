"""
Database Models Package
======================
Beanie ODM document models for MongoDB.
"""

from .user import User
from .lesson import Lesson, LessonProgress
from .challenge import Challenge, Submission
from .mcq import MCQQuestion, MCQAttempt
from .gamification import UserRewards, Badge, Achievement
from .contest import Contest, ContestParticipation
from .proctoring import ExamSession, ProctoringEvent

__all__ = [
    "User",
    "Lesson",
    "LessonProgress",
    "Challenge",
    "Submission",
    "MCQQuestion",
    "MCQAttempt",
    "UserRewards",
    "Badge",
    "Achievement",
    "Contest",
    "ContestParticipation",
    "ExamSession",
    "ProctoringEvent",
]
