from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import columns, tasks

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Kanban Local")

# CORS — разрешаем запросы из frontend (React на 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(columns.router, prefix="/columns")
app.include_router(tasks.router, prefix="/tasks")

@app.get("/")
def root():
    return {"message": "Backend работает! Фронтенд на http://localhost:5173"}
