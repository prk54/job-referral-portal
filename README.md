# Community Job Referral Portal

A full-stack job referral platform where professionals post jobs and job seekers get matched via a keyword-based engine. No LLMs — pure regex + skill dictionary matching.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Shadcn/UI |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| PDF Parsing | PyMuPDF (`fitz`) |
| Matching | Regex keyword engine (~200 skill terms) |
| Background Tasks | FastAPI `BackgroundTasks` |

## Features

- **Auth** — Supabase email/password auth with two roles: Referrer and Seeker
- **Job Posting** — Referrers post jobs with title, company, required skills, WhatsApp contact
- **Resume Parsing** — Seekers upload PDF resumes; PyMuPDF extracts text, regex matches skills
- **Async Matching** — Background task scores every job against extracted resume skills
- **Match Feed** — Seekers see jobs sorted by match % (green ≥70%, yellow ≥40%, red <40%)
- **WhatsApp CTA** — Direct "Contact on WhatsApp" button on each matched job

## How Matching Works

1. PDF uploaded → PyMuPDF extracts raw text
2. Regex scans text against a dictionary of ~200 canonical skill terms (with variants)
3. Background task compares seeker's skills vs each job's `skills_required`
4. Score = `matched skills / total job skills` (stored as float, e.g. `0.75` = 75%)
5. Results upserted into `matches` table, sorted by score on the seeker dashboard

## Project Structure

```
job-referral-portal/
├── backend/
│   ├── main.py                  # FastAPI app + CORS
│   ├── config.py                # Pydantic settings (reads .env)
│   ├── deps.py                  # JWT auth middleware
│   ├── skills_dictionary.py     # ~200 skill terms with regex variants
│   ├── routers/
│   │   ├── profile.py           # POST/GET /api/profile
│   │   ├── jobs.py              # CRUD /api/jobs
│   │   ├── resumes.py           # POST /api/resumes/upload
│   │   └── matches.py           # GET /api/matches
│   ├── services/
│   │   ├── parser.py            # PDF → text → skill list
│   │   └── matcher.py           # score calculator + background task
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── contexts/AuthContext.tsx
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── ReferrerDashboard.tsx
│       │   ├── PostJob.tsx
│       │   └── SeekerDashboard.tsx
│       └── components/Layout.tsx
├── supabase/
│   └── schema.sql               # Full DDL + RLS policies
└── .env.example
```

## Database Schema

```sql
profiles  (id, user_id, role, full_name, extracted_skills JSONB, resume_url)
jobs      (id, referrer_id, title, company, skills_required JSONB, whatsapp_link)
matches   (id, seeker_id, job_id, score FLOAT, status)
```

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Supabase Setup
1. Create a free project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Go to **Auth → Email** and disable email confirmation (for local dev)
4. Go to **Settings → API** → grab Project URL, anon key, service_role key, JWT secret

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create backend/.env from the example
cp ../.env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET

uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install

# Create frontend/.env
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL=http://localhost:8000

npm run dev
```

Open **http://localhost:5173**

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/profile` | Any | Create profile after signup |
| GET | `/api/profile/me` | Any | Get own profile |
| POST | `/api/jobs` | Referrer | Post a job |
| GET | `/api/jobs` | Any | List jobs (referrers see own, seekers see all) |
| DELETE | `/api/jobs/{id}` | Referrer | Delete own job |
| POST | `/api/resumes/upload` | Seeker | Upload PDF, triggers async matching |
| GET | `/api/resumes/skills` | Seeker | Get extracted skills |
| GET | `/api/matches` | Seeker | Get matches sorted by score |
| GET | `/health` | — | Health check |

## Environment Variables

```env
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:8000
```

## Demo Credentials (local dev only)

| Role | Email | Password |
|------|-------|----------|
| Referrer | referrer@demo.com | Demo1234! |
| Seeker | seeker@demo.com | Demo1234! |

## Security Notes

- `.env` files are gitignored — never committed
- Backend verifies Supabase JWTs using `SUPABASE_JWT_SECRET` (HS256)
- RLS policies on all tables — users can only access their own data
- Service role key used only server-side for background task writes
- Resume uploads stored in a private Supabase Storage bucket
