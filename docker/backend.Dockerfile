# Backend image: used by both development and production compose files.
# The command is chosen per compose file (runserver in dev, gunicorn in prod).
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# curl is not needed anywhere: healthchecks use stdlib Python only.
RUN useradd --create-home --uid 10001 appuser

WORKDIR /app

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

# The entrypoint lives outside /app so it survives the development bind mount
# of ./backend onto /app.
COPY docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Application code (bind-mounted over /app in development).
COPY backend/ /app/
COPY scripts/ /app/scripts/

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
