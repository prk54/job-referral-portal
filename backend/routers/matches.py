import json

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_user, get_supabase

router = APIRouter(prefix="/api/matches", tags=["matches"])


def _decode_contact(raw: str) -> dict:
    if not raw:
        return {"whatsapp_number": "", "job_link": None}
    if raw.startswith("{"):
        try:
            parsed = json.loads(raw)
            return {"whatsapp_number": parsed.get("wa", ""), "job_link": parsed.get("job")}
        except json.JSONDecodeError:
            pass
    number = raw.replace("https://wa.me/", "").replace("http://wa.me/", "")
    return {"whatsapp_number": number, "job_link": None}


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
    rows = result.data or []
    for row in rows:
        if row.get("jobs"):
            contact = _decode_contact(row["jobs"].pop("whatsapp_link", "") or "")
            row["jobs"].update(contact)
    return rows
