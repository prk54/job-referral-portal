from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_user, get_supabase

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("")
def get_matches(
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if profile["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Only seekers have matches")

    result = (
        supabase.table("matches")
        .select("*, jobs(id, title, company, skills_required, whatsapp_link, created_at)")
        .eq("seeker_id", profile["id"])
        .eq("status", "completed")
        .order("score", desc=True)
        .execute()
    )
    return result.data
