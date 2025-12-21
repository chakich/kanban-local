from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter(tags=["columns"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.Column])
def read_columns(db: Session = Depends(get_db)):
    return db.query(models.ColumnModel).order_by(models.ColumnModel.position).all()

@router.post("/", response_model=schemas.Column)
def create_column(column: schemas.ColumnCreate, db: Session = Depends(get_db)):
    db_column = models.ColumnModel(**column.dict())
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column
