from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter(tags=["tasks"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.Task])
def read_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()

@router.post("/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict(), position=0)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

# ИСПРАВЛЕННЫЙ ЭНДПОИНТ ДЛЯ ПЕРЕМЕЩЕНИЯ
# Теперь принимает JSON-объект { "column_id": ..., "position": ... }
@router.put("/{task_id}/move", response_model=schemas.Task)
def move_task(task_id: int, update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.column_id = update.column_id
    task.position = update.position
    
    db.commit()
    db.refresh(task)
    return task

# ЭНДПОИНТ РЕДАКТИРОВАНИЯ ЗАДАЧИ
@router.put("/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskBase, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    task.title = task_update.title or task.title
    if task_update.description is not None:
        task.description = task_update.description
    
    db.commit()
    db.refresh(task)
    return task

# ЭНДПОИНТ УДАЛЕНИЯ ЗАДАЧИ
@router.delete("/{task_id}", response_model=dict)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}