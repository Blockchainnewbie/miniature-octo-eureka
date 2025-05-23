# Umgebungsstruktur-Update - Änderungsprotokoll

## Übersicht der Änderungen

Die Docker Compose-Umgebung wurde vollständig überarbeitet, um eine klare Trennung zwischen Entwicklung, Produktionssimulation und CI/CD zu gewährleisten. Die folgenden Dateien wurden aktualisiert oder erstellt:

## 1. Docker Compose Konfigurationen

### Entwicklungsumgebung (`docker-compose.dev.yml`)
- **Komplett überarbeitet** mit verbesserter Konfiguration
- Netzwerke und benannte Container hinzugefügt
- Health-Checks und Abhängigkeitsbedingungen optimiert
- Container-Namen für einfache Identifikation hinzugefügt
- Verbesserte Volume-Konfiguration mit `__pycache__`-Ausschluss

### Produktionssimulation (`docker-compose.prod.local.yml`) - **NEU**
- Vollständige Containerlösung mit Frontend, Backend, DB und Redis
- Produktionskonfigurationen für alle Services
- Optimierte MySQL-Einstellungen für Produktionsähnlichkeit
- Keine externen DB-Ports für verbesserte Sicherheit
- Redis für Session-Management und Caching

### CI/CD (`docker-compose.ci.yml`)
- Angepasst für konsistente Benutzerkonfiguration
- Bereits funktional, nur minimale Anpassungen

### Legacy (`docker-compose.yml`)
- Markiert als veraltet mit klaren Migrationshinweisen
- Mit Warnsymbolen und Anweisungen versehen, welche Dateien stattdessen zu verwenden sind

## 2. Datenbank-Konfiguration

### MySQL-Benutzer
- Einheitlicher Zugang über **`apiuser`** statt wechselnder Benutzer
- Automatische Erstellung von `apiuser` beim Datenbankstart
- Konsistente Berechtigungen über alle Umgebungen hinweg

### SQL-Initialisierung
- `init.sql` aktualisiert für automatische `apiuser`-Erstellung
- Ergänzt um `./sql/create-api-user.sh` für manuelles Setup
- Produktionskonfiguration in `./sql/prod-config.cnf` hinzugefügt

## 3. Umgebungsvariablen

### `.env`-Datei
- Standardwert aktualisiert von `root` zu `apiuser`
- Kommentare zur Klarstellung hinzugefügt

### Backend-Konfiguration
- `config.py` aktualisiert für konsistente `apiuser`-Verwendung
- Standardwerte angepasst für einfacheres Setup

## 4. Dokumentation

### Neue Dokumentation
- **`docs/docker-environments.md`** mit detaillierten Erklärungen
- Umfassende Anleitung zu allen drei Umgebungen
- Troubleshooting-Tipps und Best Practices

## Zusammenfassung der neuen Struktur

### Entwicklung (docker-compose.dev.yml)
- **Backend + DB** in Containern
- Frontend lokal
- DB auf Port 43306 extern erreichbar
- Datenaustausch über Volume-Mounts

### Produktion lokal (docker-compose.prod.local.yml)
- **Backend + DB + Frontend + Redis** in Containern
- DB nur intern erreichbar
- Optimierte Container-Einstellungen
- Zusätzliche Services wie Redis

### CI/CD (docker-compose.ci.yml)
- **Backend + DB** für Testzwecke
- Keine persistenten Volumes
- Automatisierte Tests

## Übergangsempfehlungen

1. Alle alten Docker-Umgebungen herunterfahren: `docker-compose down -v`
2. Die neue Entwicklungsumgebung starten: `docker-compose -f docker-compose.dev.yml up -d`
3. Bei Datenbankproblemen: `docker volume prune` und dann neu starten
4. Frontend lokal ausführen: `cd frontend && npm run dev`
