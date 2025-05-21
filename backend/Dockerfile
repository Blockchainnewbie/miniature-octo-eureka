# Dockerfile for a Flask application

FROM python:3.10-slim as base

WORKDIR /app
ENV PYTHONPATH=/app
ENV FLASK_APP=app

COPY requirements.txt .
RUN apt-get update &amp;&amp; apt-get install -y default-libmysqlclient-dev build-essential --no-install-recommends &amp;&amp; rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt

FROM base as development
CMD ["flask", "run", "--host=0.0.0.0"]

FROM base as testing
COPY . .
CMD ["pytest"]
