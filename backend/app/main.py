"""
FastAPI Main Application Entrypoint.
Sets up REST API routes, CORS middleware, OpenAPI documentation, and startup checks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, summary, analytics, hotspots, prediction, pipeline
from app.utils.logging_config import logger

app = FastAPI(
    title="Big Data Crime Pattern Analysis & Risk Prediction API",
    description=(
        "REST API for Big Data Analytics mini-project. Integrates Hadoop HDFS, "
        "Apache PySpark distributed data processing, K-Means geographical hotspot clustering, "
        "and Random Forest spatio-temporal risk classification."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(summary.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(hotspots.router, prefix=settings.API_PREFIX)
app.include_router(prediction.router, prefix=settings.API_PREFIX)
app.include_router(pipeline.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def on_startup():
    logger.info("==================================================")
    logger.info(f"{settings.PROJECT_NAME} Backend Starting...")
    logger.info(f"OpenAPI Documentation: http://localhost:{settings.PORT}/docs")
    logger.info("==================================================")

@app.get("/")
def root():
    return {
        "message": "Big Data Crime Pattern Analysis API is active.",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
