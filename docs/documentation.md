# Projektdokumentation: Raspberry Pi Car Monitoring

## 📋 Übersicht

Das Projekt "miniature-octo-eureka" implementiert eine Webanwendung zur Überwachung von Fahrzeugsensoren über einen Raspberry Pi im Cyberpunk-Stil. Die Anwendung visualisiert Sensordaten wie Geschwindigkeit, Temperatur und einen Live-Kamerastream in einer interaktiven Benutzeroberfläche.

---

## 🏗️ Projektstruktur

```
miniature-octo-eureka/
├── backend/                # Flask-API
│   ├── app/                # Hauptanwendungscode
│   │   └── __init__.py     # App-Factory-Pattern
│   ├── Dockerfile          # Multi-stage Docker Build
│   ├── requirements.txt    # Python-Abhängigkeiten
│   └── tests/              # Pytest-Testumgebung
├── frontend/               # Vue.js Frontend
│   ├── Dockerfile          # Multi-stage Docker Build
│   ├── package.json        # Node.js Abhängigkeiten
│   └── src/                # Vue-Quellcode
├── docker-compose.yml      # Entwicklungsumgebung
├── docker-compose.ci.yml   # CI/CD-Umgebung
├── docs/
│   └── documentation.md    # Diese Dokumentation
└── github/workflows/       # CI-Pipeline
```

## 🔧 Technologie-Stack

### Backend
- **Framework**: Flask (v2.0.0+)
- **Datenbank**: MySQL mit SQLAlchemy ORM
- **Authentifizierung**: JWT-basiert mit flask-jwt-extended
- **API**: RESTful mit CORS-Unterstützung
- **Entwicklungstools**: pytest, black, flake8

### Frontend
- **Framework**: Vue.js 3 mit TypeScript
- **Build-Tools**: Vite, vue-tsc
- **Styling**: TailwindCSS für responsive UI
- **Zustandsverwaltung**: Pinia
- **HTTP-Client**: Axios für API-Kommunikation

### Infrastruktur
- **Containerisierung**: Docker mit Multi-Stage-Builds
- **Orchestrierung**: Docker Compose
- **CI/CD**: GitHub Actions
- **Datenbank**: MySQL 8.0

## 🚀 Entwicklungsumgebung

Die Entwicklungsumgebung ist vollständig containerisiert und wird über Docker Compose gesteuert:

```bash
# Repository klonen
git clone git@github.com:<Organisation>/miniature-octo-eureka.git
cd miniature-octo-eureka

# Umgebungsvariablen einrichten
cp .env.example .env
# .env-Datei anpassen (DB_PASSWORD, JWT_SECRET, etc.)

# Umgebung starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Backend-Tests ausführen
docker exec backend pytest
```

Alle Dienste kommunizieren über ein Docker-Netzwerk:
- **Backend**: Port 5000 (lokal) → http://localhost:5000
- **Frontend**: Port 8080 (lokal) → http://localhost:8080
- **Datenbank**: Port 3306 (lokal)

## ⚙️ Docker-Konfiguration

### Docker Compose (Entwicklung)

Die Docker-Compose-Konfiguration definiert drei Hauptdienste:

1. **backend**: Flask-API-Server mit Hot-Reloading für die Entwicklung
2. **frontend**: Vue.js-Entwicklungsserver mit Hot-Reloading
3. **db**: MySQL-Datenbankserver

Volumes werden verwendet, um den Code aus dem lokalen Dateisystem zu mounten und Datenbank-Persistenz zu gewährleisten.

### Docker Compose (CI)

Eine abgespeckte Version der Docker-Compose-Konfiguration für kontinuierliche Integration:

1. **backend**: Flask-API im Testmodus
2. **db**: MySQL mit isolierter Testdatenbank

## 🔄 Continuous Integration

Der CI-Workflow verwendet GitHub Actions und führt folgende Schritte aus:

1. **Tests**: Python-Tests mit pytest
2. **Build**: Docker-Container werden gebaut
3. **Integration**: Docker Compose CI-Setup für End-to-End-Tests

Tests werden bei jedem Push auf den `main`- und `dev`-Branch sowie bei Pull Requests ausgeführt.

## 📱 Architektur-Prinzipien

- **API-First**: Backend und Frontend sind strikt getrennt
- **Containerisierung**: Alle Komponenten laufen in Docker-Containern
- **Environment-Variablen**: Konfiguration über .env-Dateien
- **Mikro-Service-Ansatz**: Getrennte Container für Backend, Frontend und Datenbank

## 📝 Backend-Implementierung

Die Flask-Anwendung verwendet das Factory-Pattern zur Initialisierung:

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # MySQL-Konfiguration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://user:password@db:3306/carmonitoring'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Register blueprints
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
```

## 🎨 Frontend-Implementierung

Das Vue.js 3-Frontend nutzt moderne JavaScript-Funktionen und wird mit Vite gebaut:

```javascript
// package.json (Auszug)
{
  "name": "raspi-car-monitoring-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0"
  }
}
```

## 🧑‍💻 Entwicklungsworkflow

1. **Feature-Branches**: Neue Features werden in separaten Branches entwickelt
   ```bash
   git checkout -b feature/neue-funktion
   ```

2. **Lokale Tests**: Vor dem Commit werden Tests ausgeführt
   ```bash
   docker exec backend pytest
   ```

3. **Pull Requests**: Code-Reviews via GitHub Pull Requests
   ```bash
   # Nach Fertigstellung
   git push origin feature/neue-funktion
   # Pull Request über GitHub UI erstellen
   ```

4. **CI-Validierung**: GitHub Actions führt Tests automatisch aus

## 📚 API-Dokumentation

Die REST-API bietet folgende Hauptendpunkte:

- `POST /api/auth/login`: Anmeldung und Token-Generierung
- `POST /api/auth/refresh`: Token-Erneuerung
- `GET /api/sensors/data`: Aktuelle Sensordaten abrufen
- `GET /api/camera/stream`: MJPEG-Videostream der Kamera

## 🔐 Sicherheitskonzept

- **JWT-Authentifizierung**: Alle API-Endpunkte sind durch JWT geschützt
- **Umgebungsvariablen**: Sensible Daten werden in .env-Dateien gespeichert
- **CORS-Konfiguration**: Einschränkung auf zulässige Domains

## 📊 Datenmodell

Das Hauptdatenmodell umfasst:

- **User**: Benutzerinformationen und Zugriffsrechte
- **SensorData**: Zeitreihen von Sensormessungen
- **Alert**: Automatisch generierte Warnungen bei Schwellenwertüberschreitungen

## 📈 Leistungsoptimierung

- **Lazy Loading**: Komponenten werden nur bei Bedarf geladen
- **Pagination**: Große Datenmengen werden seitenweise abgerufen
- **Caching**: Sensordaten werden clientseitig zwischengespeichert

## 🧪 Testkonzept

- **Unit-Tests**: Isolierte Tests einzelner Funktionen
- **Integration-Tests**: Überprüfung des Zusammenspiels mehrerer Komponenten
- **End-to-End-Tests**: Vollständige Anwendungsabläufe

## 🚦 Deployment-Verfahren

1. **Vorbereitung**:
   ```bash
   # Build der Container
   docker-compose build
   ```

2. **Überprüfung**:
   ```bash
   # Tests ausführen
   docker-compose -f docker-compose.ci.yml up -d
   docker exec backend pytest
   ```

3. **Produktionsbereitstellung**:
   ```bash
   # Produktionsumgebung starten
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🛡️ Logging und Monitoring

- **Backend-Logs**: Strukturierte Logs mit unterschiedlichen Schweregrad-Stufen
- **Frontend-Telemetrie**: Erfassung von Benutzerinteraktionen (optional)
- **Container-Logs**: Zentralisierte Erfassung von Docker-Logs

## 🔄 Zukünftige Erweiterungen

- **Vision-Chatbot**: KI-gestützte Analyse der Kamerabilder
- **Mobile App**: Native Anwendung für Android/iOS
- **Erweitertes Sensorset**: Integration weiterer Fahrzeugsensoren
- **Offline-Modus**: Lokale Datenspeicherung bei fehlender Verbindung

## 📝 Projektfortschritt

- [x] Projektstruktur aufsetzen
- [x] Docker-Umgebung konfigurieren
- [x] CI-Pipeline einrichten
- [ ] Backend-API implementieren
- [ ] Frontend-Dashboard entwickeln
- [ ] Kamera-Integration
- [ ] Benutzerauthentifizierung
- [ ] Sensor-Datensammlung
- [ ] Deployment auf Raspberry Pi

---

*Dokumentation erstellt am: 20.05.2025*  
*Letzte Aktualisierung: 20.05.2025*