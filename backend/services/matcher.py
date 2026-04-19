import logging

from supabase import Client

logger = logging.getLogger(__name__)


def calculate_score(resume_skills: list[str], job_skills: list[str]) -> float:
    if not job_skills:
        return 0.0
    resume_set = {s.lower() for s in resume_skills}
    job_set = {s.lower() for s in job_skills}
    matched = resume_set & job_set
    return round(len(matched) / len(job_set), 4)


def run_matching(seeker_id: str, extracted_skills: list[str], supabase: Client) -> None:
    """Re-score all jobs for one seeker (called on resume upload)."""
    try:
        jobs_resp = supabase.table("jobs").select("id, skills_required").execute()
        jobs = jobs_resp.data or []
        if not jobs:
            return
        rows = [
            {
                "seeker_id": seeker_id,
                "job_id": job["id"],
                "score": calculate_score(extracted_skills, job.get("skills_required") or []),
                "status": "completed",
            }
            for job in jobs
        ]
        supabase.table("matches").upsert(rows, on_conflict="seeker_id,job_id").execute()
        logger.info("Matching complete for seeker %s: %d jobs scored", seeker_id, len(rows))
    except Exception:
        logger.exception("Matching failed for seeker %s", seeker_id)


def run_matching_for_new_job(job_id: str, job_skills: list[str], supabase: Client) -> None:
    """Score a newly posted job against every seeker who has uploaded a resume."""
    try:
        seekers_resp = (
            supabase.table("profiles")
            .select("id, extracted_skills")
            .eq("role", "seeker")
            .execute()
        )
        seekers = [s for s in (seekers_resp.data or []) if s.get("extracted_skills")]
        if not seekers:
            return
        rows = [
            {
                "seeker_id": seeker["id"],
                "job_id": job_id,
                "score": calculate_score(seeker["extracted_skills"], job_skills),
                "status": "completed",
            }
            for seeker in seekers
        ]
        supabase.table("matches").upsert(rows, on_conflict="seeker_id,job_id").execute()
        logger.info("New-job matching complete for job %s: %d seekers scored", job_id, len(rows))
    except Exception:
        logger.exception("New-job matching failed for job %s", job_id)
