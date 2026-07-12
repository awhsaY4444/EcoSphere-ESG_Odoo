from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import auth, master_data, gamification, social, environmental, governance, scores

app = FastAPI(title="EcoSphere ESG Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(master_data.router)
app.include_router(gamification.router)
app.include_router(social.router)
app.include_router(environmental.router)
app.include_router(governance.router)
app.include_router(scores.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Welcome to EcoSphere ESG Platform API"}
