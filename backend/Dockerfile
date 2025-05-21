# Dockerfile for a Flask application

FROM python:3.10-slim as base

WORKDIR /app
ENV PYTHONPATH=/app
ENV FLASK_APP=app

COPY requirements.txt .
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential python3.10-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

FROM base as development
CMD ["flask", "run", "--host=0.0.0.0"]

FROM base as testing
COPY . .
CMD ["pytest"]
