#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Must happen before Daphne/Twisted's asyncio reactor gets installed (which
# happens very early, as a side effect of importing daphne - earlier than
# config/asgi.py gets imported). Windows' default ProactorEventLoop is
# incompatible with redis.asyncio's timeout handling used by channels_redis,
# causing every websocket connection to die within seconds with a spurious
# "Timeout reading from 127.0.0.1:6379" even though redis itself is healthy.
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
