from sqlalchemy import Column, Integer, String, ForeignKey
from .database import Base

class ColumnModel(Base):
    __tablename__ = "columns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)   # длина + не NULL
    position = Column(Integer, default=0)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)    # длина + не NULL
    description = Column(String(2000), nullable=True)          # длина большая
    column_id = Column(Integer, ForeignKey("columns.id", ondelete="CASCADE"))
    position = Column(Integer, default=0)
