
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('fikarideshare')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.task_routes = {
    'rides.tasks.*': {'queue': 'rides'},
    'users.tasks.*': {'queue': 'users'},
    'payments.tasks.*': {'queue': 'payments'},
    'kyc.tasks.*': {'queue': 'kyc'},
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')