import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Job {
  id: string;
  title: string;
  company: string;
  skills_required: string[];
  whatsapp_number: string;
  job_link: string | null;
}

interface Match {
  id: string;
  score: number;
  status: string;
  jobs: Job;
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const [color, bg] =
    pct >= 70
      ? ["text-emerald-700", "bg-emerald-100"]
      : pct >= 40
      ? ["text-amber-700", "bg-amber-100"]
      : ["text-red-600", "bg-red-100"];
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${color} ${bg}`}>
        {pct}% match
      </span>
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SeekerDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: "info" | "success" | "error" }>({ text: "", type: "info" });
  const [skills, setSkills] = useState<string[]>(profile?.extracted_skills ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchMatches() {
    setLoadingMatches(true);
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
      setUploadMsg({ text: "Only PDF files are accepted.", type: "error" });
      return;
    }
    setUploading(true);
    setUploadMsg({ text: "Uploading and parsing your resume…", type: "info" });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post<{ extracted_skills: string[] }>(
        "/api/resumes/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSkills(res.data.extracted_skills);
      setUploadMsg({
        text: `Found ${res.data.extracted_skills.length} skill${res.data.extracted_skills.length !== 1 ? "s" : ""}. Matching with jobs…`,
        type: "success",
      });
      await refreshProfile();
      setTimeout(async () => {
        await fetchMatches();
        setUploadMsg({ text: "Matching complete!", type: "success" });
      }, 2000);
    } catch {
      setUploadMsg({ text: "Upload failed. Please try again.", type: "error" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const hasResume = !!profile?.resume_url;

  return (
    <div className="space-y-8">
      {/* Resume Upload */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {hasResume ? "Update your resume" : "Upload your resume"}
          </CardTitle>
          <p className="mt-0.5 text-xs text-indigo-200">
            {hasResume ? "Upload a new PDF to re-extract skills and re-run matching." : "Upload a PDF to extract your skills and match with jobs."}
          </p>
        </div>
        <CardContent className="pt-5 space-y-4">
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
              uploading
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="text-sm text-indigo-600 font-medium">Processing…</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload PDF resume</p>
                <p className="mt-1 text-xs text-slate-400">PDF only · Max 5 MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />

          {uploadMsg.text && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              uploadMsg.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : uploadMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            }`}>
              {uploadMsg.type === "success" && (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {uploadMsg.text}
            </div>
          )}

          {skills.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Extracted skills ({skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="bg-indigo-100 text-indigo-700 border-0">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched Jobs */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Matched jobs</h2>
            {!loadingMatches && (
              <p className="mt-0.5 text-sm text-slate-500">
                {matches.length > 0
                  ? `${matches.length} job${matches.length !== 1 ? "s" : ""} matched — sorted by relevance`
                  : "Upload your resume to get matched"}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={loadingMatches}
          >
            <svg className={`mr-1.5 h-3.5 w-3.5 ${loadingMatches ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {loadingMatches ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-700">No matches yet</h3>
            <p className="mt-1 text-sm text-slate-400">Upload your resume above to get matched with jobs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <Card
                key={m.id}
                className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold text-slate-800 leading-tight">
                        {m.jobs.title}
                      </CardTitle>
                      <p className="mt-0.5 text-sm text-slate-500">{m.jobs.company}</p>
                    </div>
                    <ScorePill score={m.score} />
                  </div>
                </CardHeader>

                <div className="mx-5 border-t border-slate-100" />

                <CardContent className="pt-3 space-y-3">
                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {m.jobs.skills_required.map((s) => {
                      const matched = skills.map((sk) => sk.toLowerCase()).includes(s.toLowerCase());
                      return (
                        <Badge
                          key={s}
                          variant={matched ? "default" : "outline"}
                          className={matched
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "border-slate-200 text-slate-500 bg-slate-50"
                          }
                        >
                          {matched && (
                            <svg className="mr-1 h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {s}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {m.jobs.job_link && (
                      <a href={m.jobs.job_link} target="_blank" rel="noopener noreferrer">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                        >
                          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View job
                        </Button>
                      </a>
                    )}
                    {m.jobs.whatsapp_number && (
                      <a
                        href={`https://wa.me/${m.jobs.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.573 3.848 1.561 5.415L2 22l4.737-1.535C8.19 21.448 10.052 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                          WhatsApp
                        </Button>
                      </a>
                    )}
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
