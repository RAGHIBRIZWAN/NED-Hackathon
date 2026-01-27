"""
Authentication API Routes
========================
User registration, login, and profile management.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field

from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.models.user import User, UserPreferences, UserStats
from app.models.gamification import UserRewards

router = APIRouter()


# ============ Schemas ============

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    programming_language: str = "python"
    instruction_language: str = "en"


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class UpdateProfileRequest(BaseModel):
    """Profile update request."""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    institution: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    """Preferences update request."""
    programming_language: Optional[str] = None
    instruction_language: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    voice_tutor_enabled: Optional[bool] = None


# ============ Routes ============

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user.
    
    - Creates user account
    - Initializes gamification data
    - Returns authentication tokens
    """
    # Check if email exists
    existing_email = await User.find_one(User.email == request.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = await User.find_one(User.username == request.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    user = User(
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        preferences=UserPreferences(
            programming_language=request.programming_language,
            instruction_language=request.instruction_language
        ),
        stats=UserStats()
    )
    await user.insert()
    
    # Initialize gamification rewards
    rewards = UserRewards(user_id=str(user.id))
    await rewards.insert()
    
    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "level": user.level,
            "coins": user.coins,
            "preferences": user.preferences.dict()
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return tokens.
    """
    # Find user
    user = await User.find_one(User.email == request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "level": user.level,
            "xp": user.xp,
            "coins": user.coins,
            "rating": user.rating,
            "preferences": user.preferences.dict(),
            "stats": user.stats.dict()
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    """
    payload = decode_token(request.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await User.get(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name
        }
    )


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "institution": user.institution,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "level": user.level,
        "xp": user.xp,
        "coins": user.coins,
        "rating": user.rating,
        "max_rating": user.max_rating,
        "badges": user.badges,
        "preferences": user.preferences.dict(),
        "stats": user.stats.dict(),
        "created_at": user.created_at
    }


@router.put("/me")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.bio is not None:
        user.bio = request.bio
    if request.institution is not None:
        user.institution = request.institution
    if request.avatar_url is not None:
        user.avatar_url = request.avatar_url
    
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": "Profile updated successfully"}


@router.put("/me/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's preferences.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if request.programming_language is not None:
        user.preferences.programming_language = request.programming_language
    if request.instruction_language is not None:
        user.preferences.instruction_language = request.instruction_language
    if request.theme is not None:
        if request.theme in user.unlocked_themes:
            user.preferences.theme = request.theme
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Theme not unlocked"
            )
    if request.notifications_enabled is not None:
        user.preferences.notifications_enabled = request.notifications_enabled
    if request.sound_enabled is not None:
        user.preferences.sound_enabled = request.sound_enabled
    if request.voice_tutor_enabled is not None:
        user.preferences.voice_tutor_enabled = request.voice_tutor_enabled
    
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": "Preferences updated successfully", "preferences": user.preferences.dict()}
