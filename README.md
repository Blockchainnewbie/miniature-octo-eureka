# Raspberry Pi Car Monitoring

Eine Webanwendung zur Überwachung von Fahrzeugsensoren (z. B. Geschwindigkeit, Temperatur, Kamerastream) über einen Raspberry Pi im Cyberpunk-Stil.

---

## 🎯 Projektziel

* **MVP** in 3 Wochen
* Live-Anzeige von Sensordaten und Kamerastream
* Authentifizierung via JWT
* Vision-Chatbot-Prototyp für Analyse und Alerts

## 🚀 Features

* **Backend:** Flask REST-API für Sensor- und Auth-Daten
* **Frontend:** Vue.js Dashboard im Cyberpunk-Design
* **Streaming:** MJPEG-Stream der Bordkamera
* **Auth:** JWT-basierte Anmeldung, Token-Refresh, Logout
* **CI/CD:** GitHub Actions für Build & Tests
* **Automatisierung:** Kanban-Board in GitHub Projects mit n8n-Integration

## 📦 Repository-Struktur

```
raspi-car-monitoring/
├── backend/                # Flask-App (API + Tests)
├── frontend/               # Vue.js 3 App
├── docker-compose.yml      # Lokal-Stack (App, DB, Nginx)
├── docker-compose.ci.yml   # Minimal-Stack für CI
├── .github/
│   └── workflows/          # CI-Pipeline
└── README.md               # Projektübersicht
```

## 🛠️ Voraussetzungen

* Docker & Docker Compose
* Node.js ≥ 16
* Python ≥ 3.10
* GitHub CLI (optional)

## 🔧 Installation & Start

1. Repository klonen:

   ```bash
   git clone git@github.com:<Organisation>/raspi-car-monitoring.git
   cd raspi-car-monitoring
   ```
2. Umgebung kopieren und anpassen:

   ```bash
   cp .env.example .env
   # Umgebungsvariablen (DB-Passwort, JWT-Secret) setzen
   ```
3. Docker-Stack starten:

   ```bash
   docker compose up -d
   ```
4. Backend-Tests ausführen:

   ```bash
   docker exec backend pytest -q
   ```
5. Dashboard im Browser öffnen:

   ```
   http://localhost:8080
   ```

## 🧑‍💻 Entwicklung

* **Feature-Branch:** `feature/<ID>-<kurzbeschreibung>`
* **Dev-Branch:** Zusammenführung aller Sprint-Tasks
* **Main-Branch:** Release-Branch mit geschützter PR-Regel

## 📋 Mitwirken

1. Issue anlegen (Sprint und Aufgabe zuordnen)
2. In neuem Branch arbeiten
3. Pull-Request erstellen und mindestens 1 Review abwarten

## 🏗️ Architekturübersicht

Unser Projekt basiert auf einer klassischen 3‑Schichten-Architektur:

1. **Präsentationsschicht (Frontend)**: Vue.js-Komponenten und Views
2. **Geschäftslogikschicht (Backend)**: Flask-API nach MVC und Clean Architecture
3. **Datenzugriffsschicht**: MySQL-Datenbank mit SQLAlchemy ORM

### Backend-Struktur

* **Application Factory** (`app/__init__.py`): Initialisierung von Flask, SQLAlchemy, JWT, CORS.
* **Models** (`app/models/`): Datenbanktabellen via SQLAlchemy (Single Responsibility).
* **Services** (`app/services/`): Geschäftslogik, getrennt von Routen.
* **Controllers** (`app/api/`): RESTful-Endpunkte, Datenvalidierung und Antwortaufbereitung.
* **Schemas** (`app/schemas/`): Marshmallow- oder Pydantic-Schemas für Serialisierung.

*Solche Trennung erleichtert Tests, Erweiterungen und Code-Wartung.*

### Frontend-Struktur

* **Components** (`src/components/`): Wiederverwendbare UI-Elemente (Single Responsibility).
* **Views** (`src/views/`): Seiten, die aus Komponenten zusammengesetzt werden.
* **Stores** (`src/stores/`): Zustandsverwaltung per Pinia (Flux Pattern).
* **Services** (`src/services/`): Axios-Clients für API-Kommunikation.

*Die klare Trennung von UI, State und Netzwerklogik fördert Wiederverwendbarkeit.*

### Docker & DevOps

* **docker-compose.yml**: Stack mit `backend`, `frontend`, `db` und Volumes.
* **docker-compose.ci.yml**: Minimaler Stack für CI-Tests.
* **Multi-Stage-Builds**: Entwicklungs- und Produktionsimages optimieren Buildgröße.

### SOLID & Clean Code

* **SRP**: Jede Klasse/Funktion erfüllt nur eine Aufgabe.
* **OCP**: Neue Sensor-Typen lassen sich per Plugin einbinden.
* **LSP**: Basisklassen ersetzbar durch spezialisierte Implementierungen.
* **ISP**: Kleine, zielgerichtete Interfaces.
* **DIP**: Abhängigkeit von Abstraktionen, nicht von konkreten Klassen.

*Einheitliche Code-Standards (ESLint, flake8), aussagekräftige Namen und Docstrings sichern langfristige Wartbarkeit.*

## 📄 Lizenz

Dieses Projekt ist lizenziert unter der MIT License.

---

*Zuletzt aktualisiert: 20.05.2025*
