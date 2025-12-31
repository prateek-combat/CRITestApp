FROM python:3.11-slim

# Install system dependencies including build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download YOLOv8 nano weights
RUN mkdir -p /app/models && \
    python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" && \
    find /root -name "yolov8n.pt" -exec cp {} /app/models/ \;

# Copy application code
COPY worker.py .
COPY analysis/ ./analysis/

# Create temp directory for processing
RUN mkdir -p /tmp/proctor_processing

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=/app/models/yolov8n.pt

# Health check - verify PostgreSQL connection and worker readiness
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import psycopg2; psycopg2.connect('$DATABASE_URL').close()" || exit 1

# Run the worker
CMD ["python", "worker.py"] 
