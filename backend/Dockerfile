# Dockerfile for a Flask application

FROM python:3.12-slim-bookworm@sha256:05fa73449bea003a9300685ce040154a0088c3087049ed44f9d8102d4af3b399 AS base

WORKDIR /app
ENV PYTHONPATH=/app
ENV FLASK_APP=app

COPY requirements.txt .
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential libpython3.12-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

FROM base AS development
CMD ["flask", "run", "--host=0.0.0.0"]

FROM base AS testing
COPY . .
CMD ["pytest"]
