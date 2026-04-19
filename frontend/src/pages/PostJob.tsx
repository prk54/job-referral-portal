import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL_SKILLS = [
  "Python","JavaScript","TypeScript","Java","Go","Rust","C++","C#","Ruby","PHP",
  "Swift","Kotlin","Scala","Bash","React","Vue","Angular","Next.js","Svelte",
  "HTML","CSS","Tailwind CSS","Bootstrap","jQuery","Redux","Webpack","Vite",
  "FastAPI","Django","Flask","Node.js","Express","NestJS","Spring Boot","Rails",
  "Laravel","ASP.NET","GraphQL","REST API","gRPC","WebSocket","OAuth","JWT",
  "SQL","PostgreSQL","MySQL","SQLite","MongoDB","Redis","Elasticsearch",
  "Cassandra","DynamoDB","Firebase","Supabase","Prisma","SQLAlchemy","TypeORM",
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Ansible","CI/CD",
  "GitHub Actions","Jenkins","CircleCI","Nginx","Linux","Serverless",
  "Microservices","Kafka","RabbitMQ","Celery","Airflow",
  "TensorFlow","PyTorch","Scikit-learn","Keras","Pandas","NumPy","Spark",
  "Tableau","Power BI","Snowflake","BigQuery","Databricks","Machine Learning",
  "Deep Learning","Natural Language Processing","Computer Vision",
  "React Native","Flutter","Android","iOS",
  "Jest","Pytest","Selenium","Cypress","Playwright",
  "Agile","Scrum","Kanban","TDD","Git","GitHub","Figma","Postman",
  "Project Management","Product Management","Data Analysis","Data Engineering",
  "Data Science","DevOps","SRE","UI/UX","Security","Blockchain","Leadership",
];

export function PostJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = ALL_SKILLS.filter(
    (s) =>
      s.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(s)
  ).slice(0, 8);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      setError("Add at least one required skill.");
      return;
    }
    if (!/^\+?\d{7,15}$/.test(whatsappNumber.replace(/\s/g, ""))) {
      setError("Enter a valid WhatsApp number (digits only, e.g. 919876543210).");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/jobs", {
        title,
        company,
        whatsapp_number: whatsappNumber.replace(/\s/g, ""),
        job_link: jobLink || null,
        skills_required: selectedSkills,
      });
      navigate("/referrer");
    } catch {
      setError("Failed to post job. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Post a job</h1>
        <p className="mt-1 text-sm text-slate-500">Fill in the details and required skills to start matching candidates.</p>
      </div>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-700">Job details</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Job title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Company</Label>
              <Input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  WhatsApp number
                  <span className="ml-1 text-xs text-slate-400 font-normal">(with country code)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+</span>
                  <Input
                    required
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^\d\s+]/g, ""))}
                    placeholder="919876543210"
                    className="pl-7 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Job link
                  <span className="ml-1 text-xs text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  type="url"
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  placeholder="https://jobs.example.com/..."
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Required skills</Label>
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2">
                  {selectedSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                      onClick={() => toggleSkill(s)}
                    >
                      {s} ×
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="Search skills…"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
              {skillSearch && (
                <div className="rounded-lg border border-slate-200 bg-white p-1 shadow-md">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
                  ) : (
                    filtered.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        onClick={() => {
                          toggleSkill(s);
                          setSkillSearch("");
                        }}
                      >
                        {s}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedSkills.length === 0 && !skillSearch && (
                <p className="text-xs text-slate-400">Type above to search and add skills</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/referrer")}
                className="border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
              >
                {submitting ? "Posting…" : "Post job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
