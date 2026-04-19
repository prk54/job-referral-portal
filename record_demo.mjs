import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FRAMES_DIR = "/tmp/demo_frames";
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const W = 1280, H = 800;
let frameIdx = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, label) {
  const file = path.join(FRAMES_DIR, `frame_${String(frameIdx).padStart(3, "0")}_${label}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`  📸 [${frameIdx}] ${label}`);
  frameIdx++;
}

async function selectSkill(page, skill) {
  await page.type('input[placeholder*="Search skills"]', skill);
  await sleep(500);
  await page.evaluate((s) => {
    const btns = Array.from(document.querySelectorAll("div.rounded-lg button, button.w-full"));
    const btn = btns.find((b) => b.textContent.trim() === s);
    if (btn) btn.click();
  }, skill);
  await sleep(350);
}

const browser = await puppeteer.launch({
  headless: false,
  args: ["--window-size=1280,830", "--no-sandbox"],
  defaultViewport: { width: W, height: H },
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H });

// ── REFERRER: Login ────────────────────────────────────────────────────────
console.log("\n── Referrer flow ──");
await page.goto("http://localhost:5173/login");
await sleep(900);
await shot(page, "01_login_page");

await page.type('input[type="email"]', "referrer@demo.com");
await sleep(300);
await page.type('input[type="password"]', "Demo1234!");
await sleep(400);
await shot(page, "02_credentials_filled");

await page.click('button[type="submit"]');
await page.waitForSelector('h1', { timeout: 10000 });
await sleep(700);
await shot(page, "03_referrer_dashboard");

// ── REFERRER: Post a job ───────────────────────────────────────────────────
await page.click('a[href="/post-job"]');
await page.waitForSelector('input[placeholder*="Senior Backend"]', { timeout: 6000 });
await sleep(400);
await shot(page, "04_post_job_form");

// Fill form fields
await page.focus('input[placeholder*="Senior Backend"]');
await page.keyboard.down("Meta"); await page.keyboard.press("a"); await page.keyboard.up("Meta");
await page.type('input[placeholder*="Senior Backend"]', "ML Platform Engineer");
await sleep(200);
await page.focus('input[placeholder*="Acme"]');
await page.keyboard.down("Meta"); await page.keyboard.press("a"); await page.keyboard.up("Meta");
await page.type('input[placeholder*="Acme"]', "DeepMind Labs");
await sleep(200);
await page.focus('input[type="tel"]');
await page.keyboard.down("Meta"); await page.keyboard.press("a"); await page.keyboard.up("Meta");
await page.type('input[type="tel"]', "919900000099");
await sleep(200);
await page.focus('input[type="url"]');
await page.keyboard.down("Meta"); await page.keyboard.press("a"); await page.keyboard.up("Meta");
await page.type('input[type="url"]', "https://deepmindlabs.ai/jobs/ml");
await sleep(300);
await shot(page, "05_form_details_filled");

for (const skill of ["Python", "TensorFlow", "Docker", "AWS"]) {
  // Clear search box first
  await page.$eval('input[placeholder*="Search skills"]', (el) => (el.value = ""));
  await selectSkill(page, skill);
}
await shot(page, "06_skills_added");

await page.click('button[type="submit"]');
await page.waitForSelector('h1', { timeout: 8000 });
await sleep(900);
await shot(page, "07_job_posted_dashboard");

// ── SEEKER: Login ─────────────────────────────────────────────────────────
console.log("\n── Seeker flow ──");

// Sign out
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Sign out")
  );
  if (btn) btn.click();
});
await page.waitForSelector('input[type="email"]', { timeout: 6000 });
await sleep(600);
await shot(page, "08_login_page_seeker");

await page.type('input[type="email"]', "seeker@demo.com");
await sleep(200);
await page.type('input[type="password"]', "Demo1234!");
await sleep(300);
await shot(page, "09_seeker_credentials");

await page.click('button[type="submit"]');
await page.waitForSelector('.space-y-8', { timeout: 10000 });
await sleep(800);
await shot(page, "10_seeker_dashboard_initial");

// ── SEEKER: Upload resume via API, show upload state ──────────────────────
console.log("  Uploading data-scientist resume via API...");
const seekerToken = execSync(
  `curl -s -X POST "https://lveikdqyiuwcohaererc.supabase.co/auth/v1/token?grant_type=password" ` +
    `-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZWlrZHF5aXV3Y29oYWVyZXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNzA3MywiZXhwIjoyMDkyMTEzMDczfQ.f_h66xlZi4-bQuOSg9KzTSwuicR-70pDe2Jlv8q6Nzo" ` +
    `-H "Content-Type: application/json" ` +
    `-d '{"email":"seeker@demo.com","password":"Demo1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"`,
  { encoding: "utf-8" }
).trim();

execSync(
  `curl -s -X POST "http://localhost:8000/api/resumes/upload" ` +
    `-H "Authorization: Bearer ${seekerToken}" ` +
    `-F "file=@/Users/prateeklalwani/projects/job-referral-portal/backend/test_resumes/resume_data_scientist.pdf;type=application/pdf"`,
  { encoding: "utf-8" }
);

console.log("  Waiting for background matching...");
await sleep(3000);

// Reload to pick up new skills + matches
await page.reload({ waitUntil: "networkidle0" });
await sleep(900);
await shot(page, "11_seeker_skills_extracted");

// Scroll to matches
await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
await sleep(600);
await shot(page, "12_seeker_matches_top");

await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "smooth" }));
await sleep(600);
await shot(page, "13_seeker_matches_bottom");

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await sleep(500);
await shot(page, "14_final_overview");

await browser.close();
console.log(`\n✅ ${frameIdx} frames saved to ${FRAMES_DIR}`);
