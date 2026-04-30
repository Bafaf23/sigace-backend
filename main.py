from contextlib import asynccontextmanager

from app.db import get_db_connection
from app.views.auth import router as auth_router
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify DB connectivity on startup.
    conn = get_db_connection()
    conn.close()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "app": "SIGACE API",
        "version": "1.0.0",
        "status": "online",
        "database": "connected",
        "developer": "Bryant Facenda",
        "environment": "development",
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"DEBUG VALIDATION ERROR: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()},
    )


app.include_router(auth_router)
