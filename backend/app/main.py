from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import columns, tasks

# Создаём таблицы
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Kanban Local")

# САМОЕ ГЛАВНОЕ — разрешаем ВСЁ с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # разрешаем любой источник
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(columns.router, prefix="/columns")
app.include_router(tasks.router, prefix="/tasks")

@app.get("/")
def root():
    return {"message": "Backend работает! Фронтенд на http://localhost:5173"}
