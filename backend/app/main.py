from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .api import holidays
from .core.settings import settings
from .models.database import engine, Base
import time
import logging

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Middleware for logging and timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Path: {request.url.path} Method: {request.method} Time: {process_time:.4f}s")
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(holidays.router, prefix=f"{settings.API_V1_STR}/holidays", tags=["holidays"])

@app.get("/")
def root():
    return {"message": "Welcome to Rwanda Holidays API", "version": "1.0.0"}
