# Projektdokumentation: Raspberry Pi Car Monitoring

## 📋 Übersicht

Das Projekt "miniature-octo-eureka" implementiert eine Webanwendung zur Überwachung von Fahrzeugsensoren über einen Raspberry Pi im Cyberpunk-Stil. Die Anwendung visualisiert Sensordaten wie Geschwindigkeit, Temperatur und einen Live-Kamerastream in einer interaktiven Benutzeroberfläche.

---

## 🏗️ Projektstruktur

```
miniature-octo-eureka/
├── .gitignore
├── backend/                # Flask-API
│   ├── .env.example      # Beispiel Umgebungsvariablen
│   ├── Dockerfile          # Multi-stage Docker Build
│   ├── requirements.txt    # Python-Abhängigkeiten
│   └── app/                # Hauptanwendungscode
│       ├── __init__.py     # App-Factory und Blueprint-Registrierung
│       └── config.py       # Konfigurationseinstellungen
├── docs/
│   ├── documentation.md    # Diese Dokumentation
│   └── projectstructure.md # Detaillierte Projektstruktur (falls vorhanden)
├── docker-compose.ci.yml   # CI/CD-Umgebung
├── docker-compose.yml      # Entwicklungsumgebung
├── frontend/               # Vue.js Frontend
│   ├── Dockerfile          # Multi-stage Docker Build
│   ├── package-lock.json   # Exakte Versionen der Node.js Abhängigkeiten
│   ├── package.json        # Node.js Abhängigkeiten und Skripte
│   └── vite.config.js      # Vite Konfiguration
├── github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI-Pipeline
├── img/                    # Bilddateien (Logos, Diagramme etc.)
├── LICENSE                 # Projektlizenz
└── README.md               # Projektübersicht und Setup-Anleitung
```



## 🔧 Technologie-Stack

### Backend
- **Framework**: Flask (>=2.0.0)
- **Datenbank**: MySQL (Version 8.0) mit SQLAlchemy ORM (>=3.0.0)
- **Datenbank-Treiber**: PyMySQL (>=1.0.0)
- **Authentifizierung**: JWT-basiert mit Flask-JWT-Extended (>=4.0.0)
- **API**: RESTful mit CORS-Unterstützung (Flask-CORS >=4.0.0)
- **Entwicklungstools**: pytest (>=7.0.0), black (>=22.0.0), flake8 (>=4.0.0), python-dotenv (>=0.19.0)

### Frontend
- **Framework**: Vue.js (^3.3.0) mit TypeScript (~5.0.0)
- **Build-Tools**: Vite (^4.3.0), vue-tsc (^1.6.0)
- **Styling**: TailwindCSS (^3.3.0), PostCSS (^8.4.0), Autoprefixer (^10.4.0)
- **Zustandsverwaltung**: Pinia (^2.1.0)
- **HTTP-Client**: Axios (^1.4.0) für API-Kommunikation
- **Routing**: Vue Router (^4.2.0)
- **Linting**: ESLint (^8.40.0), eslint-plugin-vue (^9.13.0), @typescript-eslint/eslint-plugin (^5.59.0), @typescript-eslint/parser (^5.59.0)

### Infrastruktur
- **Containerisierung**: Docker mit Multi-Stage-Builds (Basisimages: `python:3.10-slim` für Backend, `node:16-slim` und `nginx:alpine` für Frontend)
- **Orchestrierung**: Docker Compose
- **CI/CD**: GitHub Actions
- **Datenbank**: MySQL 8.0 (Authentifizierungs-Plugin: `mysql_native_password`)

## 🚀 Entwicklungsumgebung

Die Entwicklungsumgebung ist vollständig containerisiert und wird über Docker Compose gesteuert:

```bash
# Repository klonen (Beispiel)
# git clone git@github.com:<Organisation>/miniature-octo-eureka.git
# cd miniature-octo-eureka

# Umgebungsvariablen einrichten (falls .env.example vorhanden und benötigt)
# cp backend/.env.example backend/.env
# backend/.env-Datei anpassen (DB_PASSWORD, JWT_SECRET, etc.)

# Gesamten Stack starten
docker compose up -d

# Logs anzeigen
docker compose logs -f

# Backend-Tests ausführen (lokal im Container)
docker exec backend pytest -q
# Alternativ, falls der Befehl in README.md aktueller ist:
# docker compose exec backend pytest -q

# Frontend Linting ausführen
# (Innerhalb des Frontend-Containers oder über package.json Skript, falls definiert)
# Beispiel: docker compose exec frontend npm run lint
```

Alle Dienste kommunizieren über ein Docker-Netzwerk:
- **Backend**: Port `5000:5000` (Host:Container) → http://localhost:5000
  - Interner Startbefehl: `flask run --host=0.0.0.0`
- **Frontend**: Port `8080:8080` (Host:Container) → http://localhost:8080
  - Interner Startbefehl: `npm run dev`
- **Datenbank (MySQL)**: Port `43306:3306` (Host:Container)

## ⚙️ Docker-Konfiguration

### Docker Compose (Entwicklung - [`docker-compose.yml`](docker-compose.yml:1))

Die Docker-Compose-Konfiguration definiert drei Hauptdienste:

1. **backend**: Flask-API-Server. Verwendet das `development`-Stage aus [`backend/Dockerfile`](backend/Dockerfile:1). Health Check auf `/api/health`.
2. **frontend**: Vue.js-Entwicklungsserver (Vite). Verwendet das `development`-Stage aus [`frontend/Dockerfile`](frontend/Dockerfile:1).
3. **db**: MySQL-Datenbankserver (Version 8.0). Health Check vorhanden.

Volumes werden verwendet, um den Code aus dem lokalen Dateisystem zu mounten und Datenbank-Persistenz zu gewährleisten.

### Docker Compose (CI - [`docker-compose.ci.yml`](docker-compose.ci.yml:1))

Eine angepasste Docker-Compose-Konfiguration für kontinuierliche Integration:

1. **backend**: Flask-API im Testmodus. Verwendet das `testing`-Stage aus [`backend/Dockerfile`](backend/Dockerfile:15).
2. **db**: MySQL-Datenbankserver (Version 8.0) für Tests.

## 🔄 Continuous Integration ([`github/workflows/ci.yml`](github/workflows/ci.yml:1))

Der CI-Workflow verwendet GitHub Actions und führt folgende Schritte aus:

1. **Checkout**: Code wird ausgecheckt.
2. **Setup Python**: Python-Umgebung wird eingerichtet.
3. **Install Backend Dependencies**: Backend-Abhängigkeiten werden installiert.
4. **Run Backend Tests (Directly)**: `pytest` wird direkt ausgeführt.
5. **Set up Docker Buildx**: Docker Buildx wird eingerichtet.
6. **Build Docker Images (CI)**: Docker-Images werden mit [`docker-compose.ci.yml`](docker-compose.ci.yml:41) gebaut.
7. **Start Services (CI)**: Services werden mit [`docker-compose.ci.yml`](docker-compose.ci.yml:42) gestartet.
8. **Run Backend Tests (Docker)**: `pytest` wird innerhalb des Backend-Containers ausgeführt (`docker-compose -f docker-compose.ci.yml exec -T backend pytest`).

Tests werden bei jedem Push auf den `main`- und `dev`-Branch sowie bei Pull Requests ausgeführt (Standardverhalten von GitHub Actions, falls so konfiguriert).

## 📱 Architektur-Prinzipien

- **API-First-Ansatz**: Trennung von Backend (API) und Frontend.
- **Containerisierung**: Nutzung von Docker für Entwicklung und CI.
- **Konfiguration über Umgebungsvariablen**: Für Datenbank-Zugangsdaten, JWT-Secrets etc. (siehe [`backend/app/config.py`](backend/app/config.py:1) und [`docker-compose.yml`](docker-compose.yml:1)).
- **3-Schichten-Architektur** (angestrebt, laut [`README.md`](README.md:87)): Präsentation (Vue.js), Geschäftslogik (Flask), Datenzugriff (MySQL mit SQLAlchemy). Die genaue Umsetzung der Schichten in Verzeichnissen wie `models`, `services`, `api` ist in der aktuellen Struktur nicht explizit sichtbar.
- **SOLID & Clean Code**-Prinzipien werden angestrebt (laut [`README.md`](README.md:118)).
- **Health Checks**: Für Backend und Datenbank in [`docker-compose.yml`](docker-compose.yml:16) definiert.

## 📝 Backend-Implementierung

Die Flask-Anwendung verwendet das Factory-Pattern zur Initialisierung ([`backend/app/__init__.py`](backend/app/__init__.py:1)):

```python
# backend/app/__init__.py (Illustrativer Auszug basierend auf Analyse)
from flask import Flask, jsonify # jsonify hinzugefügt für Health Check Beispiel
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
# from .config import Config # Korrekter Importpfad, falls config.py im selben Ordner ist
# Annahme: config.py ist im app-Verzeichnis, daher from .config import Config
# oder, falls es global ist: from config import Config (muss im PYTHONPATH sein)
# Laut Struktur: from app.config import Config oder wenn create_app von außerhalb app aufgerufen wird

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class_name='ProductionConfig'): # Parameter angepasst an config.py
    app = Flask(__name__)
    # Dynamisches Laden der Konfiguration basierend auf config_class_name
    # Beispiel: app.config.from_object(f"app.config.{config_class_name}")
    # Für die Analyse nehmen wir an, dass die Config direkt geladen wird oder Standard ist
    # app.config.from_object(Config) # Dies würde eine globale Config-Klasse erwarten

    # Konfiguration aus app.config laden (Beispiel für DevelopmentConfig)
    app.config.from_object('app.config.DevelopmentConfig') # Beispielhaft

    db.init_app(app)
    jwt.init_app(app)
    CORS(app) # Standard-CORS-Initialisierung

    # Register blueprints (Beispielhaft, da app.api nicht existiert)
    # from app.api import bp as api_bp # Original, aber app.api existiert nicht
    # app.register_blueprint(api_bp, url_prefix='/api')

    # Beispiel für einen einfachen Health-Check-Endpunkt direkt in __init__.py
    @app.route('/api/health')
    def health_check():
        return jsonify(status="UP"), 200

    # Weitere Routen und Blueprints hier registrieren

    return app
```
*Hinweis: Der obige Code ist eine Interpretation basierend auf der Analyse. Die tatsächliche Implementierung von `create_app` und die Blueprint-Registrierung in [`backend/app/__init__.py`](backend/app/__init__.py:2) sollten für exakte Details geprüft werden. API-Endpunkte werden unter dem Präfix `/api` erwartet.*

## 🎨 Frontend-Implementierung

Das Vue.js 3-Frontend nutzt moderne JavaScript-Funktionen und wird mit Vite gebaut:

```javascript
// frontend/package.json (Auszug relevanter Abhängigkeiten)
{
  "name": "miniature-octo-eureka-frontend", // Name kann variieren
  "version": "0.1.0", // Version kann variieren
  "scripts": {
    "dev": "vite", // Startet Vite Dev Server
    "build": "vue-tsc && vite build", // TypeScript Check und Vite Build (vue-tsc Version ^1.6.0)
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore" // Linting Befehl
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0"
    // Weitere Abhängigkeiten...
  },
  "devDependencies": {
    "vite": "^4.3.0",
    "vue-tsc": "^1.6.0", // Korrigierte Version aus Analyse
    "typescript": "~5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0", // Korrigierte Version aus Analyse
    "autoprefixer": "^10.4.0", // Korrigierte Version aus Analyse
    "eslint": "^8.40.0",
    "eslint-plugin-vue": "^9.13.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0", // Korrigierte Version aus Analyse
    "@typescript-eslint/parser": "^5.59.0" // Korrigierte Version aus Analyse
    // Weitere devDependencies...
  }
}
```

---



## 🧑‍💻 Entwicklungsworkflow

1. **Feature-Branches**: Neue Features werden in separaten Branches entwickelt.
   ```bash
   git checkout -b feature/neue-funktion
   ```

2. **Lokale Tests**: Vor dem Commit werden Tests und Linting ausgeführt.
   ```bash
   # Backend Tests
   docker compose exec backend pytest -q 
   # Frontend Linting (Beispiel)
   # docker compose exec frontend npm run lint 
   ```

3. **Pull Requests**: Code-Reviews via GitHub Pull Requests.
   ```bash
   # Nach Fertigstellung
   git push origin feature/neue-funktion
   # Pull Request über GitHub UI erstellen
   ```

4. **CI-Validierung**: GitHub Actions führt Tests automatisch aus.

## 📚 API-Dokumentation

Die REST-API (Präfix `/api`) bietet voraussichtlich folgende Endpunkte (basierend auf Konventionen und Analyse):

- `GET /api/health`: Health-Check-Endpunkt (bestätigt in [`docker-compose.yml`](docker-compose.yml:17)).
- Authentifizierungs-Endpunkte (z.B. `/api/auth/login`, `/api/auth/refresh`), falls Flask-JWT-Extended genutzt wird.
- Daten-Endpunkte (z.B. `/api/sensors/data`, `/api/camera/stream`), falls implementiert.

*Hinweis: Da das Verzeichnis [`backend/app/api/`](backend/app/api/) nicht gefunden wurde, sind spezifische Routen-Definitionen nicht automatisch extrahierbar und müssen im Code ([`backend/app/__init__.py`](backend/app/__init__.py:21) oder anderen Modulen) geprüft werden.*

## 🔐 Sicherheitskonzept

- **JWT-Authentifizierung**: API-Endpunkte können durch Flask-JWT-Extended geschützt werden.
- **Umgebungsvariablen**: Sensible Daten (DB-Credentials, JWT-Secret) werden über Umgebungsvariablen konfiguriert (siehe [`backend/.env.example`](backend/.env.example:1), [`backend/app/config.py`](backend/app/config.py:1)).
- **CORS-Konfiguration**: Flask-CORS ist für Cross-Origin Resource Sharing eingerichtet.

## 📊 Datenmodell

- Laut [`README.md`](README.md:96) sollten Modelldefinitionen in `app/models/` liegen. Dieses Verzeichnis wurde in der aktuellen Projektstruktur nicht gefunden.
- SQLAlchemy-Modelle für Entitäten wie `User`, `SensorData`, `Alert` etc. müssten bei Bedarf definiert und in der Anwendung initialisiert werden.

## 📈 Leistungsoptimierung

- **Frontend**: Vite bietet von Haus aus Optimierungen wie schnelles Hot Module Replacement (HMR) und optimierte Builds. Lazy Loading von Routen und Komponenten ist mit Vue Router und Vue möglich.
- **Backend**: Effiziente Datenbankabfragen mit SQLAlchemy, ggf. Caching-Strategien.

## 🧪 Testkonzept

- **Backend**:
  - Test-Framework: `pytest`.
  - Tests werden im Rahmen der CI-Pipeline ausgeführt ([`github/workflows/ci.yml`](github/workflows/ci.yml:25)).
  - Eine separate Test-Datenbank-Konfiguration ist vorhanden ([`backend/app/config.py`](backend/app/config.py:28) - `TestingConfig`, [`docker-compose.ci.yml`](docker-compose.ci.yml:11)).
  - Das `testing`-Target im [`backend/Dockerfile`](backend/Dockerfile:15) führt `pytest` aus.
- **Frontend**:
  - Linting mit ESLint ist konfiguriert ([`frontend/package.json`](frontend/package.json:9)).
  - Keine expliziten Unit- (z.B. Vitest, Jest) oder E2E-Test-Frameworks (z.B. Cypress, Playwright) wurden in [`frontend/package.json`](frontend/package.json:1) gefunden. Diese könnten bei Bedarf hinzugefügt werden.

## 🚦 Deployment-Verfahren (Annahmen basierend auf Analyse)

- **Frontend**: Das [`frontend/Dockerfile`](frontend/Dockerfile:12) enthält eine `production`-Stage, die `npm run build` ausführt und die statischen Assets für Nginx vorbereitet. Dies deutet auf ein Deployment der Frontend-Anwendung als statische Dateien hin.
- **Backend**: Das [`backend/Dockerfile`](backend/Dockerfile:1) kann für Produktions-Builds verwendet werden (z.B. ohne Development-Tools).
- **CI/CD**: Die CI-Pipeline in [`github/workflows/ci.yml`](github/workflows/ci.yml:1) fokussiert sich auf Testen und Bauen der Docker-Images. Explizite Deployment-Schritte in eine Produktionsumgebung (z.B. auf einen Server, Cloud-Dienst) sind nicht Teil der aktuellen CI-Konfiguration und müssten ergänzt werden.
- Ein `docker-compose.prod.yml` (erwähnt in alter Doku) wurde nicht in der Analyse gefunden.

## 🛡️ Logging und Monitoring

- **Backend**: Standard-Logging-Fähigkeiten von Flask. Keine spezifischen erweiterten Logging-Bibliotheken explizit identifiziert.
- **Frontend**: Browser-Konsole für Entwicklungs-Logs. Keine spezifischen Telemetrie- oder Monitoring-Tools in [`frontend/package.json`](frontend/package.json:1) identifiziert.
- **Container-Logs**: Docker Compose stellt Logs für alle Services bereit (`docker compose logs`).

## To-Do: Admin-Benutzerverwaltung
- Im Dashboard muss eine Funktion implementiert werden, mit der Administratoren neue Benutzerkonten anlegen können.
- Die öffentliche Registrierung ist deaktiviert, daher erfolgt das Anlegen von Usern ausschließlich durch Admins über das Backend/Dashboard.

## 🔄 Zukünftige Erweiterungen

- Implementierung der fehlenden Verzeichnisstrukturen für Models, Services, API-Controller im Backend und Komponenten/Views im Frontend.
- Ausbau der API-Endpunkte.
- Entwicklung der Frontend-Komponenten und -Ansichten.
- Integration von Unit- und E2E-Tests für das Frontend.
- Definition und Implementierung des Datenmodells mit SQLAlchemy.
- Konfiguration von Deployment-Skripten/Pipelines für eine Produktionsumgebung.
- Erweiterung des Loggings und Monitorings.

## 📝 Projektfortschritt

- [x] Projektstruktur aufsetzen (Basis vorhanden)
- [x] Docker-Umgebung konfigurieren (Entwicklung und CI)
- [x] CI-Pipeline einrichten (Testen und Bauen)
- [ ] Backend-API implementieren (Basis mit Health-Check, weitere Endpunkte fehlen)
- [ ] Frontend-Dashboard entwickeln (Basis-Setup vorhanden, Komponenten fehlen)
- [ ] Kamera-Integration (nicht ersichtlich)
- [ ] Benutzerauthentifizierung (Backend-Tool vorhanden, Implementierung offen)
- [ ] Sensor-Datensammlung (nicht ersichtlich)
- [ ] Deployment auf Raspberry Pi (oder andere Produktionsumgebung)

---

*Dokumentation erstellt am: 20.05.2025*
*Letzte Aktualisierung: 21.05.2025*