import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Flat list of canonical skills for the multi-select
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
  const [whatsapp, setWhatsapp] = useState("");
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
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/jobs", {
        title,
        company,
        whatsapp_link: whatsapp,
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
      <h1 className="mb-6 text-2xl font-semibold">Post a job</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <Label>Job title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp link</Label>
              <Input
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://wa.me/1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label>Required skills</Label>
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer"
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
              />
              {skillSearch && (
                <div className="rounded-md border bg-popover p-1 shadow-sm">
                  {filtered.length === 0 ? (
                    <p className="px-2 py-1 text-sm text-muted-foreground">
                      No matches
                    </p>
                  ) : (
                    filtered.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
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
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/referrer")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting…" : "Post job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
