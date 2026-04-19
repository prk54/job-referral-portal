from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from deps import get_current_user, get_supabase

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileCreate(BaseModel):
    role: str
    full_name: str
    user_id: str


class ProfileUpdate(BaseModel):
    full_name: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_profile(body: ProfileCreate, supabase: Client = Depends(get_supabase)):
    if body.role not in ("referrer", "seeker"):
        raise HTTPException(status_code=400, detail="role must be 'referrer' or 'seeker'")

    existing = (
        supabase.table("profiles")
        .select("id")
        .eq("user_id", body.user_id)
        .maybe_single()
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Profile already exists")

    result = (
        supabase.table("profiles")
        .insert({"user_id": body.user_id, "role": body.role, "full_name": body.full_name})
        .execute()
    )
    return result.data[0]


@router.get("/me")
def get_my_profile(profile: dict = Depends(get_current_user)):
    return profile
