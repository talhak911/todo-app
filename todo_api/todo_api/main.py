from dotenv import load_dotenv
import os
load_dotenv()

from todo_api.config.db import create_tables, engine
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from todo_api.models.todo import TodoStatusUpdate, User, Todo, TodoUpdate, UserCreate, UserLogin, TodoCreate
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Annotated
import shutil
from pathlib import Path
from fastapi.staticfiles import StaticFiles


# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

app = FastAPI(title="Todo API with Authentication")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if user is None:
            raise credentials_exception
    return user

def authenticate_user(username: str, password: str):
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if not user:
            return False
        if not verify_password(password, user.hashed_password):
            return False
        return user

# Authentication endpoints
@app.post("/signup")
def signup(user: UserCreate):
    with Session(engine) as session:
        # Check if user already exists
        statement = select(User).where(User.username == user.username)
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
        )
        
        try:
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            return {"message": "User created successfully", "user_id": db_user.id}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {e}"
            )

@app.post("/login")
def login(user: UserLogin):
    authenticated_user = authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": authenticated_user.id,
        "username": authenticated_user.username
    }

# Protected user endpoints
@app.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# Todo endpoints (user-specific)
@app.get("/todos")
def get_user_todos(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        try:
            statement = select(Todo).where(Todo.user_id == current_user.id)
            todos = session.exec(statement).all()
            return todos
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch todos: {e}"
            )

@app.post("/todos")
def add_todo(
    title: str = Form(...),
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        try:
            image_url = None
            
            # Handle image upload if provided
            if image:
                # Validate file type
                allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
                if image.content_type not in allowed_types:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
                    )
                
                # Generate unique filename
                file_extension = image.filename.split(".")[-1]
                filename = f"todo_{current_user.id}_{datetime.now().timestamp()}.{file_extension}"
                file_path = UPLOAD_DIR / filename
                
                # Save file
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                
                image_url = str(file_path)
            
            # Create todo
            todo = Todo(
                title=title,
                description=description,
                is_completed=False,
                user_id=current_user.id,
                added_by=current_user.username,
                image_url=image_url
            )
            
            session.add(todo)
            session.commit()
            session.refresh(todo)
            
            return {"message": "Todo added successfully", "todo_id": todo.id}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add todo: {e}"
            )

@app.put("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_completed: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        try:
            # Get todo and verify ownership
            todo = session.get(Todo, todo_id)
            if not todo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Todo not found"
                )
            
            if todo.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this todo"
                )
            print("is completed ", is_completed)
            # Update fields if provided
            if title is not None:
                todo.title = title
            if description is not None:
                todo.description = description
            if is_completed is not None:
                todo.is_completed = is_completed
            
            # Handle image update
            if image:
                # Validate file type
                allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
                if image.content_type not in allowed_types:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
                    )
                
                # Remove old image if exists
                if todo.image_url and Path(todo.image_url).exists():
                    Path(todo.image_url).unlink()
                
                # Save new image
                file_extension = image.filename.split(".")[-1]
                filename = f"todo_{current_user.id}_{datetime.now().timestamp()}.{file_extension}"
                file_path = UPLOAD_DIR / filename
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                
                todo.image_url = str(file_path)
            
            session.commit()
            return {"message": "Todo updated successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update todo: {e}"
            )

# @app.put("/todos/{todo_id}/status")
# def update_todo_status(
#     todo_id: int,
#     is_completed: bool,
#     current_user: User = Depends(get_current_user)
# ):
#     with Session(engine) as session:
#         try:
#             todo = session.get(Todo, todo_id)
#             if not todo:
#                 raise HTTPException(
#                     status_code=status.HTTP_404_NOT_FOUND,
#                     detail="Todo not found"
#                 )
            
#             if todo.user_id != current_user.id:
#                 raise HTTPException(
#                     status_code=status.HTTP_403_FORBIDDEN,
#                     detail="Not authorized to update this todo"
#                 )
            
#             todo.is_completed = is_completed
#             session.commit()
#             return {"message": "Todo status updated successfully"}
#         except Exception as e:
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail=f"Failed to update todo status: {e}"
#             )

@app.put("/todos/{todo_id}/status")
def update_todo_status(
    todo_id: int,
    status_update: TodoStatusUpdate,  # Use the Pydantic model
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        try:
            todo = session.get(Todo, todo_id)
            if not todo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Todo not found"
                )
            
            if todo.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this todo"
                )
            
            todo.is_completed = status_update.is_completed
            session.commit()
            session.refresh(todo)
            return todo  # Return the updated todo
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update todo status: {e}"
            )

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        try:
            todo = session.get(Todo, todo_id)
            if not todo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Todo not found"
                )
            
            if todo.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this todo"
                )
            
            # Remove image file if exists
            if todo.image_url and Path(todo.image_url).exists():
                Path(todo.image_url).unlink()
            
            session.delete(todo)
            session.commit()
            return {"message": "Todo deleted successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete todo: {e}"
            )

# Image serving endpoint
@app.get("/images/{filename}")
def get_image(filename: str):
    from fastapi.responses import FileResponse
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return FileResponse(file_path)

def start():
    create_tables()
    uvicorn.run("todo_api.main:app", reload=True, host="127.0.0.1", port=8080)