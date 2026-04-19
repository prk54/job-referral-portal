import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from deps import get_current_user, get_supabase
from services.matcher import run_matching_for_new_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    title: str
    company: str
    skills_required: list[str]
    whatsapp_number: str
    job_link: str | None = None


def _decode_contact(raw: str) -> dict:
    """Decode whatsapp_link column which may be a JSON blob or a legacy URL."""
    if not raw:
        return {"whatsapp_number": "", "job_link": None}
    if raw.startswith("{"):
        try:
            parsed = json.loads(raw)
            return {"whatsapp_number": parsed.get("wa", ""), "job_link": parsed.get("job")}
        except json.JSONDecodeError:
            pass
    # Legacy: full wa.me URL
    number = raw.replace("https://wa.me/", "").replace("http://wa.me/", "")
    return {"whatsapp_number": number, "job_link": None}


def _normalize_job(job: dict) -> dict:
    contact = _decode_contact(job.pop("whatsapp_link", "") or "")
    return {**job, **contact}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreate,
    background_tasks: BackgroundTasks,
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if profile["role"] != "referrer":
        raise HTTPException(status_code=403, detail="Only referrers can post jobs")

    contact_blob = json.dumps({"wa": body.whatsapp_number, "job": body.job_link})
    result = (
        supabase.table("jobs")
        .insert(
            {
                "referrer_id": profile["id"],
                "title": body.title,
                "company": body.company,
                "skills_required": body.skills_required,
                "whatsapp_link": contact_blob,
            }
        )
        .execute()
    )
    job = result.data[0]
    background_tasks.add_task(run_matching_for_new_job, job["id"], body.skills_required, supabase)
    return _normalize_job(job)


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
    return [_normalize_job(j) for j in result.data]


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
