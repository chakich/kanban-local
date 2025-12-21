from pydantic import BaseModel
from typing import List, Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    column_id: int

class TaskUpdate(BaseModel):
    column_id: int
    position: int

class Task(TaskBase):
    id: int
    column_id: int
    position: int

    class Config:
        from_attributes = True

class ColumnBase(BaseModel):
    title: str
    position: Optional[int] = 0

class ColumnCreate(ColumnBase):
    pass

class Column(ColumnBase):
    id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True
