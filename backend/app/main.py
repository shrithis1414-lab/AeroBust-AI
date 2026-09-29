from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api.endpoints import router as api_router
from .ml.model import get_bust_model
from .ml.explainability import get_explainer

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warmup AI models and explainers on startup."""
    print("Initializing AeroBust-AI meteorological model engine...")
    model = get_bust_model()
    _ = get_explainer()
    print(f"AeroBust-AI ready! Model status: {'Trained' if model.is_trained else 'Initialized'}")
    yield

app = FastAPI(
    title="AeroBust-AI Engine",
    description="Indian Weather Forecast Bust & Confidence Prediction System (Days 1–10)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite and React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "system": "AeroBust-AI",
        "description": "Indian Weather Forecast Bust & Confidence Prediction System",
        "domain": "Lat 6°N-38°N, Lon 68°E-98°E (Lead Days 1-10)",
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
