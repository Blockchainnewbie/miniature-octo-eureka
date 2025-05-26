# ---- Build Stage: Install requirements and run tests ----
FROM python:3.11-slim-bookworm AS build

# System deps for Pi camera, GPIO, and MJPEG streaming
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libatlas-base-dev \
        libjpeg-dev \
        libopenjp2-7-dev \
        libtiff5 \
        libqt5gui5 \
        libqt5test5 \
        libilmbase-dev \
        libavformat-dev \
        libswscale-dev \
        libx264-dev \
        libv4l-dev \
        ffmpeg \
        v4l-utils \
        git \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Copy code and install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the source code and tests
COPY . .

# Run tests (fail the build if tests fail)
RUN pip install pytest pytest-mock && pytest --maxfail=1 --disable-warnings --tb=short

# ---- Final Stage: Runtime Environment ----
FROM python:3.11-slim-bookworm AS runtime

# System deps for Pi camera, GPIO, and MJPEG streaming (runtime only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libatlas-base-dev \
        libjpeg-dev \
        libopenjp2-7-dev \
        libtiff5 \
        libqt5gui5 \
        libqt5test5 \
        libilmbase-dev \
        libavformat-dev \
        libswscale-dev \
        libx264-dev \
        libv4l-dev \
        ffmpeg \
        v4l-utils \
        && rm -rf /var/lib/apt/lists/*

# Add non-root user for RPi GPIO (optional, for security)
RUN groupadd -g 997 gpio && useradd -u 997 -g gpio -m picarx

WORKDIR /app
COPY --from=build /app /app

ENV PYTHONUNBUFFERED=1
ENV PYCAM_NO_PREVIEW=1

# Entrypoint for web interface (passe ggf. an)
CMD ["python", "-m", "my_picarx.web.http_server"]

# Healthcheck für Docker Compose/Swarm
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8080/ || exit 1

# Notes für Kamera/Hardwarezugriff:
# Für Pi-Kamera: Container mit --device /dev/vchiq:/dev/vchiq --privileged oder --group-add gpio starten.
# Beispiel:
# docker run --rm --privileged --device /dev/vchiq -p 8080:8080 ghcr.io/<user>/<repo>:latest