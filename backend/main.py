from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import jobs, matches, profile, resumes

app = FastAPI(title="Job Referral Portal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(matches.router)


@app.get("/health")
def health():
    return {"status": "ok"}
