from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import analyze, tts, location
import asyncio
import uvicorn
from app.modules.image_processing import cleanup_temp_images
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files so the saved images are publicly accessible
app.mount("/public", StaticFiles(directory="public"), name="public")

# Include routers
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
# app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(location.router, prefix="/location", tags=["location"])
app.include_router(tts.router, prefix="/tts", tags=["tts"])

@app.get("/")
def read_root():
    return {"message": "VisionVoice Backend Running!"}

# Periodic cleanup of temporary images on startup
@app.on_event("startup")
async def startup_event():
    async def periodic_cleanup():
        while True:
            await cleanup_temp_images(expiration_seconds=3600)
            await asyncio.sleep(3600)  # Run cleanup every hour
    asyncio.create_task(periodic_cleanup())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
