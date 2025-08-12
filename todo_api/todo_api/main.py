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
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import tempfile
import os

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

app = FastAPI(title="Todo API with Authentication and Cloudinary")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

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

def upload_image_to_cloudinary(file: UploadFile, user_id: int) -> str:
    """Upload image to Cloudinary and return the URL"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
            )
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file.file.read())
            temp_file_path = temp_file.name
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            temp_file_path,
            folder="todo_images",  # Organize images in a folder
            public_id=f"todo_{user_id}_{int(datetime.now().timestamp())}",
            resource_type="image",
            # Optional: Add transformations
            # transformation=[{'width': 800, 'height': 600, 'crop': 'limit', 'quality': 'auto'}]
        )
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return upload_result['secure_url']
    
    except Exception as e:
        # Clean up temporary file in case of error
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

def delete_image_from_cloudinary(image_url: str):
    """Delete image from Cloudinary using the URL"""
    try:
        # Extract public_id from URL
        # Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        url_parts = image_url.split('/')
        filename_with_ext = url_parts[-1]
        public_id = filename_with_ext.split('.')[0]
        
        # If the image is in a folder, we need to include the folder path
        if 'todo_images/' in image_url:
            public_id = f"todo_images/{public_id}"
        
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        # Log the error but don't fail the operation
        print(f"Warning: Failed to delete image from Cloudinary: {str(e)}")

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

@app.get("/")
def root():
    return {"message": "Api is running!"}

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
                image_url = upload_image_to_cloudinary(image, current_user.id)
            
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
                # Delete old image from Cloudinary if exists
                if todo.image_url:
                    delete_image_from_cloudinary(todo.image_url)
                
                # Upload new image to Cloudinary
                todo.image_url = upload_image_to_cloudinary(image, current_user.id)
            
            session.commit()
            return {"message": "Todo updated successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update todo: {e}"
            )

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
            
            # Remove image from Cloudinary if exists
            if todo.image_url:
                delete_image_from_cloudinary(todo.image_url)
            
            session.delete(todo)
            session.commit()
            return {"message": "Todo deleted successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete todo: {e}"
            )

# def start():
#     create_tables()
#     uvicorn.run("todo_api.main:app", reload=True, host="127.0.0.1", port=8080)

# if __name__ == "__main__":
#     start()