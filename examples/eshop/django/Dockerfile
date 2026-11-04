# Built from the repository root (see ../compose.yaml): requirements.txt installs habarico from
# ../../../python, which only resolves in a context holding the whole monorepo.
FROM python:3.10-slim

# curl backs the healthcheck in compose.yaml.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo/examples/eshop/django

# The library first, so editing the example alone does not reinstall it.
COPY python /repo/python
COPY examples/eshop/django/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY examples/eshop/django /repo/examples/eshop/django

EXPOSE 8000
# `seed` is idempotent, so a restart against an existing database is a no-op.
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed && python manage.py runserver 0.0.0.0:8000"]
