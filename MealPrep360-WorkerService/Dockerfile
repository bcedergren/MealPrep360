FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ /app/app/

RUN useradd -m -u 1000 workeruser && chown -R workeruser:workeruser /app
USER workeruser

# Start Celery worker
CMD ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "--concurrency=4"]

