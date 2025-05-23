# Docker Compose Umgebungen - Leitfaden

## Überblick

Dieses Projekt verwendet drei verschiedene Docker Compose Konfigurationen für unterschiedliche Entwicklungs- und Deployment-Szenarien:

## 🔧 Development Environment (`docker-compose.dev.yml`)

**Zweck**: Lokale Entwicklung mit containerisiertem Backend und Datenbank

### Aufbau:
- **Backend**: Containerisiert mit Hot-Reload
- **Datenbank**: MySQL 8.0 Container
- **Frontend**: Läuft LOKAL (nicht containerisiert)

### Verwendung:
```bash
# Starten der Development-Umgebung
docker-compose -f docker-compose.dev.yml up -d

# Logs verfolgen
docker-compose -f docker-compose.dev.yml logs -f

# Stoppen
docker-compose -f docker-compose.dev.yml down

# Mit Volume-Cleanup
docker-compose -f docker-compose.dev.yml down -v
```

### Besonderheiten:
- MySQL läuft auf Port `43306` (extern erreichbar)
- Backend läuft auf Port `5000`
- Frontend läuft separat auf Port `3000` (lokale Installation)
- Code-Changes werden automatisch übernommen (Hot-Reload)
- Verwendet `apiuser` für Datenbankzugriff
- Volume-Mounting für Backend-Code

### Frontend lokal starten:
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Production Simulation (`docker-compose.prod.local.yml`)

**Zweck**: Lokale Simulation der Produktionsumgebung

### Aufbau:
- **Frontend**: Nginx-Container mit optimiertem Build
- **Backend**: Gunicorn-Server Container
- **Datenbank**: MySQL 8.0 mit Produktionsoptimierungen
- **Redis**: Caching und Session-Management

### Verwendung:
```bash
# Starten der Production-Simulation
docker-compose -f docker-compose.prod.local.yml up -d

# Build und Start (bei Code-Änderungen)
docker-compose -f docker-compose.prod.local.yml up --build -d

# Logs verfolgen
docker-compose -f docker-compose.prod.local.yml logs -f

# Stoppen
docker-compose -f docker-compose.prod.local.yml down
```

### Besonderheiten:
- Frontend läuft auf Port `3000` (Nginx)
- Backend läuft auf Port `5000` (Gunicorn)
- MySQL ist NICHT extern erreichbar (nur intern)
- Redis für Caching und Sessions
- Produktionsoptimierte MySQL-Konfiguration
- Mehrere Gunicorn-Worker

## ⚙️ CI/CD Environment (`docker-compose.ci.yml`)

**Zweck**: Automatisierte Tests in GitHub Actions

### Aufbau:
- **Backend**: Test-Container
- **Datenbank**: MySQL für Tests

### Verwendung:
```bash
# Lokales Testen der CI-Umgebung
docker-compose -f docker-compose.ci.yml up --build --abort-on-container-exit

# Cleanup
docker-compose -f docker-compose.ci.yml down -v
```

### Besonderheiten:
- Verwendet `root`-Benutzer für Tests
- Automatisches Herunterfahren nach Tests
- Optimiert für schnelle Ausführung
- Keine persistenten Volumes

## 🗃️ Datenbank-Konfiguration

### Benutzer und Berechtigungen:

| Umgebung | Benutzer | Passwort | Berechtigungen |
|----------|----------|----------|----------------|
| Development | `apiuser` | `.env DB_PASSWORD` | SELECT, INSERT, UPDATE, DELETE |
| Production Sim | `apiuser` | `.env DB_PASSWORD` | SELECT, INSERT, UPDATE, DELETE |
| CI/CD | `root` | `.env DB_PASSWORD` | ALL PRIVILEGES |

### Ports:

| Umgebung | MySQL Port | Extern erreichbar |
|----------|------------|------------------|
| Development | `43306` | ✅ Ja |
| Production Sim | `3306` | ❌ Nein |
| CI/CD | `3306` | ❌ Nein |

## 📁 Volumes und Persistenz

### Development:
- `mysql_data_dev`: MySQL-Daten
- Code-Mounting für Hot-Reload

### Production Simulation:
- `mysql_data_prod`: MySQL-Daten
- `redis_data_prod`: Redis-Daten

### CI/CD:
- Keine persistenten Volumes (Tests)

## 🔒 Umgebungsvariablen

Alle Umgebungen verwenden die `.env`-Datei:

```bash
DB_PASSWORD=your_password_here
DB_HOST=localhost          # Für lokale Frontend-Verbindung
DB_PORT=43306             # Für Development
DB_NAME=carmonitoring
DB_USER=apiuser           # Für Development/Production
```

## 🚀 Schnellstart

### 1. Development Setup:
```bash
# 1. Backend und DB starten
docker-compose -f docker-compose.dev.yml up -d

# 2. Frontend separat starten
cd frontend && npm install && npm run dev

# 3. Zugriff:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - MySQL: localhost:43306
```

### 2. Production Test:
```bash
# Alles containerisiert starten
docker-compose -f docker-compose.prod.local.yml up --build -d

# Zugriff:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
```

### 3. CI/CD Test:
```bash
# Lokale CI-Tests
docker-compose -f docker-compose.ci.yml up --build --abort-on-container-exit
```

## 🔧 Troubleshooting

### Port-Konflikte:
```bash
# Prüfe belegte Ports
ss -tlnp | grep :43306
ss -tlnp | grep :5000
ss -tlnp | grep :3000
```

### Volume-Probleme:
```bash
# Volumes löschen und neu erstellen
docker-compose -f docker-compose.dev.yml down -v
docker volume prune
```

### Netzwerk-Probleme:
```bash
# Netzwerke bereinigen
docker network prune
```

### Container-Status:
```bash
# Status aller Container
docker ps -a

# Logs eines spezifischen Containers
docker logs car_monitoring_backend_dev
```

## 📋 Best Practices

1. **Development**: Nutze `docker-compose.dev.yml` für tägliche Entwicklung
2. **Testing**: Teste Änderungen in `docker-compose.prod.local.yml` vor Deployment
3. **CI/CD**: Automatische Tests laufen mit `docker-compose.ci.yml`
4. **Cleanup**: Verwende regelmäßig `docker system prune` für Aufräumung
5. **Secrets**: Niemals Passwörter in Git committen - nutze `.env` Datei
