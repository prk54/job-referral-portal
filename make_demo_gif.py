"""Assemble demo GIF from /tmp/demo_frames PNG screenshots."""
import glob, sys, os
from PIL import Image

FRAMES_DIR = "/tmp/demo_frames"
OUT = os.path.join(os.path.dirname(__file__), "demo.gif")

paths = sorted(glob.glob(f"{FRAMES_DIR}/frame_*.png"))
if not paths:
    print("No frames found in", FRAMES_DIR)
    sys.exit(1)

# Per-frame durations (ms) — longer on "result" frames
DURATIONS = {
    "01_login_page":            1800,
    "02_credentials_filled":    800,
    "03_referrer_dashboard":    2000,
    "04_post_job_form":         1500,
    "05_form_details_filled":   1500,
    "06_skills_added":          1500,
    "07_job_posted_dashboard":  2200,
    "08_login_page_seeker":     1200,
    "09_seeker_credentials":    700,
    "10_seeker_dashboard_initial": 1500,
    "11_seeker_skills_extracted":  2200,
    "12_seeker_matches_top":    2200,
    "13_seeker_matches_bottom": 2200,
    "14_final_overview":        3000,
}

images, durations = [], []
for p in paths:
    # filename: frame_000_01_login_page.png → key: 01_login_page
    parts = os.path.basename(p).replace(".png","").split("_")
    key = "_".join(parts[2:])  # skip "frame" and "000"
    img = Image.open(p).convert("RGBA")
    w, h = img.size
    img = img.resize((w // 2, h // 2), Image.LANCZOS)
    images.append(img.convert("P", palette=Image.ADAPTIVE, colors=256))
    durations.append(DURATIONS.get(key, 1200))
    print(f"  {key}: {durations[-1]}ms")

images[0].save(
    OUT,
    save_all=True,
    append_images=images[1:],
    loop=0,
    duration=durations,
    optimize=False,
)
total = sum(durations) / 1000
size_kb = os.path.getsize(OUT) // 1024
print(f"\n✅  Saved {OUT}")
print(f"   {len(images)} frames · {total:.1f}s loop · {size_kb} KB")
