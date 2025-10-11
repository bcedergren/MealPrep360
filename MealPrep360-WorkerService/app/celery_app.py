"""Celery application configuration"""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Create Celery app
app = Celery(
    'mealprep360_workers',
    broker=f'redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}',
    backend=f'redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}',
    include=['app.tasks.recipes', 'app.tasks.images', 'app.tasks.maintenance']
)

# Configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Scheduled tasks
app.conf.beat_schedule = {
    # Generate recipes daily at 2 AM
    'generate-daily-recipes': {
        'task': 'app.tasks.recipes.generate_daily_recipes',
        'schedule': crontab(hour=2, minute=0),
    },
    # Clean up old jobs weekly
    'cleanup-old-jobs': {
        'task': 'app.tasks.maintenance.cleanup_old_jobs',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Sunday 3 AM
    },
    # Generate missing images daily
    'generate-missing-images': {
        'task': 'app.tasks.images.process_recipes_without_images',
        'schedule': crontab(hour=4, minute=0),
    },
}

if __name__ == '__main__':
    app.start()

