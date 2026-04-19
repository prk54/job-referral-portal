"""Generate synthetic test resume PDFs with known technical skills."""
import fitz
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test_resumes")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_resume(filename: str, content: str) -> str:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.insert_text(
        (50, 60),
        content,
        fontsize=10,
        fontname="helv",
        color=(0, 0, 0),
    )
    path = os.path.join(OUTPUT_DIR, filename)
    doc.save(path)
    doc.close()
    return path


RESUMES = {
    "resume_fullstack.pdf": """
John Smith
Full Stack Software Engineer
john.smith@email.com | github.com/jsmith | linkedin.com/in/jsmith

SUMMARY
Experienced full-stack engineer with 5 years of experience building scalable web applications
using Python, React, and SQL. Strong background in FastAPI, PostgreSQL, and Docker.

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frontend: React, Next.js, HTML, CSS, Tailwind CSS, Redux
Backend: FastAPI, Django, Node.js, REST API, GraphQL
Databases: PostgreSQL, MySQL, SQLite, Redis
DevOps: Docker, AWS, GitHub Actions, CI/CD, Linux
Tools: Git, GitHub, Postman, Figma, Agile, Scrum

EXPERIENCE
Senior Software Engineer — TechCorp (2021–Present)
- Built scalable Python FastAPI microservices handling 1M+ req/day
- Developed React + TypeScript frontend dashboards with Redux state management
- Designed PostgreSQL schemas and wrote complex SQL queries for analytics
- Containerized services with Docker and deployed to AWS using GitHub Actions CI/CD

Software Engineer — StartupXYZ (2019–2021)
- Full-stack development with Django (Python) and React
- REST API design and implementation
- PostgreSQL database optimization, query tuning
- Implemented JWT authentication and OAuth

EDUCATION
B.Tech Computer Science — IIT Delhi (2015–2019)
""",

    "resume_data_scientist.pdf": """
Priya Sharma
Data Scientist | ML Engineer
priya.sharma@email.com | github.com/prsharma

SUMMARY
Data scientist with expertise in Python, Machine Learning, and SQL analytics.
Experience building and deploying TensorFlow and PyTorch models in production.
Strong background in Pandas, NumPy, Scikit-learn, and data engineering pipelines.

SKILLS
Languages: Python, SQL, R, Bash
ML/AI: Machine Learning, Deep Learning, TensorFlow, PyTorch, Keras, Scikit-learn
Data: Pandas, NumPy, Spark, Databricks, Snowflake, BigQuery
Visualization: Tableau, Power BI, Matplotlib
NLP: Natural Language Processing, spaCy, NLTK
Computer Vision, OpenCV
Databases: PostgreSQL, MySQL, MongoDB, Redis
Cloud: AWS, GCP, Docker

EXPERIENCE
Senior Data Scientist — DataTech Inc (2020–Present)
- Built NLP pipelines using Python and spaCy for document classification
- Trained Deep Learning models with TensorFlow achieving 94% accuracy
- Developed ETL pipelines with Apache Spark and Databricks
- SQL analytics in BigQuery and Snowflake for business reporting
- Created Tableau dashboards for executive reporting

Data Analyst — Analytics Co (2018–2020)
- Python + Pandas data cleaning and feature engineering
- Scikit-learn ML models for customer churn prediction
- PostgreSQL database queries and data warehousing
- Power BI dashboards for sales analytics

EDUCATION
M.S. Data Science — Stanford University (2016–2018)
B.Tech Computer Engineering — BITS Pilani (2012–2016)
""",

    "resume_frontend.pdf": """
Alex Johnson
Frontend Developer | UI Engineer
alex@email.com | github.com/alexj

SUMMARY
Passionate frontend developer specializing in React, TypeScript, and modern CSS.
Expert in Next.js, Redux, and performance optimization. Experience with React Native mobile.

SKILLS
Languages: JavaScript, TypeScript, HTML, CSS
Frameworks: React, Next.js, Vue, Angular, Svelte
Styling: Tailwind CSS, CSS, Sass, Bootstrap
State: Redux, Zustand, MobX
Mobile: React Native, Flutter, iOS
Testing: Jest, Cypress, Playwright, Selenium
Tools: Webpack, Vite, Git, GitHub, Figma, Postman
Backend: Node.js, Express, REST API, GraphQL, WebSocket
Databases: MongoDB, Firebase, PostgreSQL

EXPERIENCE
Senior Frontend Engineer — ProductCo (2021–Present)
- Built complex React + TypeScript applications with Redux
- Server-side rendering with Next.js improving SEO and Core Web Vitals
- Designed responsive UI components with Tailwind CSS
- End-to-end testing with Cypress and Jest unit tests
- Collaborated with Figma designs and backend REST API + GraphQL

Frontend Developer — AgencyXYZ (2019–2021)
- React and Vue single-page applications
- JavaScript/TypeScript migration of legacy jQuery codebase
- HTML, CSS, Bootstrap UI development
- Node.js + Express API integrations
- React Native mobile app for iOS and Android

EDUCATION
B.Sc Computer Science — MIT (2015–2019)
""",
}


def main():
    print("Generating test resume PDFs...")
    for filename, content in RESUMES.items():
        path = make_resume(filename, content.strip())
        print(f"  Created: {path}")
    print(f"\nResumes saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
