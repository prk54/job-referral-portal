from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from deps import get_current_user, get_supabase

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    title: str
    company: str
    skills_required: list[str]
    whatsapp_link: str


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreate,
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if profile["role"] != "referrer":
        raise HTTPException(status_code=403, detail="Only referrers can post jobs")

    result = (
        supabase.table("jobs")
        .insert(
            {
                "referrer_id": profile["id"],
                "title": body.title,
                "company": body.company,
                "skills_required": body.skills_required,
                "whatsapp_link": body.whatsapp_link,
            }
        )
        .execute()
    )
    return result.data[0]


@router.get("")
def list_jobs(
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if profile["role"] == "referrer":
        result = (
            supabase.table("jobs")
            .select("*")
            .eq("referrer_id", profile["id"])
            .order("created_at", desc=True)
            .execute()
        )
    else:
        result = (
            supabase.table("jobs").select("*").order("created_at", desc=True).execute()
        )
    return result.data


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    existing = (
        supabase.table("jobs")
        .select("id, referrer_id")
        .eq("id", job_id)
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if existing.data["referrer_id"] != profile["id"]:
        raise HTTPException(status_code=403, detail="Not your job")

    supabase.table("jobs").delete().eq("id", job_id).execute()
