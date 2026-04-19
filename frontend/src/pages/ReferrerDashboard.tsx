import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
  created_at: string;
}

export function ReferrerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchJobs() {
    try {
      const res = await api.get<Job[]>("/api/jobs");
      setJobs(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function deleteJob(id: string) {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setDeletingId(id);
    await api.delete(`/api/jobs/${id}`);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your job postings</h1>
        <Link to="/post-job" className={cn(buttonVariants({ variant: "default" }))}>
          + Post a job
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground">
          <CardContent>
            No jobs posted yet.{" "}
            <Link to="/post-job" className="underline">
              Post your first job
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {job.company}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === job.id}
                    onClick={() => deleteJob(job.id)}
                  >
                    {deletingId === job.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-3">
                <div className="flex flex-wrap gap-1">
                  {job.skills_required.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Posted{" "}
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
