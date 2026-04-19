import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from supabase import Client

from deps import get_current_user, get_supabase
from services.matcher import run_matching
from services.parser import parse_resume

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

ALLOWED_CONTENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload")
async def upload_resume(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    profile: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if profile["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Only seekers can upload resumes")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    # Upload to Supabase Storage
    storage_path = f"{profile['user_id']}/{uuid.uuid4()}.pdf"
    supabase.storage.from_("resumes").upload(
        path=storage_path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )
    resume_url = f"{supabase.storage_url}/object/resumes/{storage_path}"

    # Parse skills from PDF
    extracted_skills = parse_resume(pdf_bytes)

    # Persist extracted skills + resume URL to profile
    supabase.table("profiles").update(
        {"extracted_skills": extracted_skills, "resume_url": resume_url}
    ).eq("id", profile["id"]).execute()

    # Trigger async matching (runs after response is sent)
    background_tasks.add_task(run_matching, profile["id"], extracted_skills, supabase)

    return {"extracted_skills": extracted_skills, "resume_url": resume_url}


@router.get("/skills")
def get_skills(profile: dict = Depends(get_current_user)):
    if profile["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Only seekers can view extracted skills")
    return {"extracted_skills": profile.get("extracted_skills") or []}
