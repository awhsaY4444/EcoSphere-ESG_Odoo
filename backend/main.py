from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import auth, master_data, gamification, social, environmental, governance, scores, reports, settings, notifications

app = FastAPI(title="EcoSphere ESG Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(master_data.router, prefix="/master_data")
app.include_router(gamification.router, prefix="/gamification")
app.include_router(social.router, prefix="/social")
app.include_router(environmental.router, prefix="/environmental")
app.include_router(governance.router, prefix="/governance")
app.include_router(scores.router, prefix="/scores")
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(notifications.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Welcome to EcoSphere ESG Platform API"}
