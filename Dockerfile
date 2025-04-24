FROM python:3.11.9-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY backend/app /app/app

# Expose the FastAPI port
EXPOSE 8000

# Run the FastAPI app from backend/app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
