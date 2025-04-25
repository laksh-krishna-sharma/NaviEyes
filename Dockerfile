FROM python:3.11.9-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY backend/app /app/app

# Create the public directory for static files
RUN mkdir -p public

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]