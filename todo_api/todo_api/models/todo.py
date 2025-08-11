from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import BaseModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(min_length=3, max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    hashed_password: str


class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(max_length=1000)
    is_completed: bool = Field(default=False)
    user_id: int = Field(foreign_key="user.id")
    added_by: str
    image_url: Optional[str] = Field(default=None, max_length=500)


# Pydantic models for API requests/responses
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(max_length=100)
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(max_length=1000)


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    is_completed: Optional[bool] = None


class TodoStatusUpdate(BaseModel):
    is_completed: bool