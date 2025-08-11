from sqlmodel import SQLModel, create_engine
import os

# Load from environment
connection = os.getenv("POSTGRES_URL")
if not connection:
    raise ValueError("POSTGRES_URL not set in environment variables.")

engine = create_engine(connection, connect_args={"sslmode": "require"})

def create_tables():
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ Tables created successfully.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

