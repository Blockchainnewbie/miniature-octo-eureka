# syntax=docker/dockerfile:1.4

FROM python:3.10-slim as base

WORKDIR /app
ENV PYTHONPATH=/app
ENV FLASK_APP=app

COPY requirements.txt .
RUN pip install -r requirements.txt

FROM base as development
CMD ["flask", "run", "--host=0.0.0.0"]

FROM base as testing
COPY . .
CMD ["pytest"]
