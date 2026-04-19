import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Job {
  id: string;
  title: string;
  company: string;
  skills_required: string[];
  whatsapp_link: string;
}

interface Match {
  id: string;
  score: number;
  status: string;
  jobs: Job;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 70
      ? "bg-green-100 text-green-800"
      : pct >= 40
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {pct}% match
    </span>
  );
}

export function SeekerDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [skills, setSkills] = useState<string[]>(
    profile?.extracted_skills ?? []
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchMatches() {
    try {
      const res = await api.get<Match[]>("/api/matches");
      setMatches(res.data);
    } finally {
      setLoadingMatches(false);
    }
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadMsg("Only PDF files are accepted.");
      return;
    }
    setUploading(true);
    setUploadMsg("Uploading and parsing…");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post<{ extracted_skills: string[] }>(
        "/api/resumes/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSkills(res.data.extracted_skills);
      setUploadMsg(
        `Found ${res.data.extracted_skills.length} skills. Matching jobs…`
      );
      await refreshProfile();
      // Poll for matches after 2s (background task needs a moment)
      setTimeout(async () => {
        await fetchMatches();
        setUploadMsg("Matching complete.");
      }, 2000);
    } catch {
      setUploadMsg("Upload failed. Please try again.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      {/* Resume Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 transition-colors hover:border-primary hover:bg-muted/30"
            onClick={() => fileRef.current?.click()}
          >
            <svg
              className="mb-2 h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              />
            </svg>
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading…" : "Click to upload PDF resume"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          {uploadMsg && (
            <p className="text-sm text-muted-foreground">{uploadMsg}</p>
          )}
          {skills.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Extracted skills ({skills.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched Jobs Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Matched jobs</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoadingMatches(true);
              fetchMatches();
            }}
          >
            Refresh
          </Button>
        </div>

        {loadingMatches ? (
          <p className="text-muted-foreground">Loading matches…</p>
        ) : matches.length === 0 ? (
          <Card className="py-12 text-center text-muted-foreground">
            <CardContent>
              No matches yet. Upload your resume to get matched with jobs.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{m.jobs.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {m.jobs.company}
                      </p>
                    </div>
                    <ScoreBadge score={m.score} />
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-3">
                  <div className="flex flex-wrap gap-1">
                    {m.jobs.skills_required.map((s) => (
                      <Badge
                        key={s}
                        variant={
                          skills.map((sk) => sk.toLowerCase()).includes(s.toLowerCase())
                            ? "default"
                            : "outline"
                        }
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3">
                    <a
                      href={m.jobs.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Contact on WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
