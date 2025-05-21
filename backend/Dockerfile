# Dockerfile for a Flask application

FROM python:3.13-slim-bookworm AS base

WORKDIR /app
ENV PYTHONPATH=/app
ENV FLASK_APP=app

COPY requirements.txt .
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential python3-all-dev pkg-config gcc --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

FROM base AS development
CMD ["flask", "run", "--host=0.0.0.0"]

FROM base AS testing
COPY . .
CMD ["pytest"]
