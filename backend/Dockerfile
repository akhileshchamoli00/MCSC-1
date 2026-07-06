FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for psycopg2 or other C extensions if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Cloud Run expects PORT environment variable, defaults to 8080)
ENV PORT 8080
EXPOSE 8080

# Command to run on start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
