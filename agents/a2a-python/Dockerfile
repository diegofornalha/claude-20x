# A2A Python Server Docker Image
FROM python:3.11-slim

LABEL maintainer="A2A Python SDK"
LABEL description="A2A Protocol Server Implementation"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and source code
COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY server.py ./

# Install Python dependencies
RUN pip install --no-cache-dir -e .
RUN pip install --no-cache-dir uvicorn[standard]

# Create non-root user
RUN useradd --create-home --shell /bin/bash a2a
RUN chown -R a2a:a2a /app
USER a2a

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8888/health')" || exit 1

# Start server
CMD ["python", "server.py", "--port", "8888"]