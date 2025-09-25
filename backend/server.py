from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Import routes
from routes.auth import router as auth_router
from routes.users import router as users_router
from database import db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="ParentGuard API", description="Parental Control Platform API", version="1.0.0")

# Create a router with the /api prefix for legacy endpoints
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "ParentGuard API is running", "status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

# Include authentication and user routes
app.include_router(auth_router)
app.include_router(users_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
