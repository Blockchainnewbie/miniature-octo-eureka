# Umgebungsstruktur-Update - Änderungsprotokoll

## Übersicht der Änderungen

Die Docker Compose-Umgebung wurde vollständig überarbeitet, um eine klare Trennung zwischen Entwicklung, Produktionssimulation und CI/CD zu gewährleisten. Zusätzlich wurden Datenbankmigrationen mit Flask-Migrate eingeführt, um Schemaänderungen konsistent zu verwalten. Die folgenden Dateien wurden aktualisiert oder erstellt:

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

## 4. Datenbankmigration mit Flask-Migrate

### Migration-Setup
- Flask-Migrate (basierend auf Alembic) für versionierte Datenbankänderungen implementiert
- Migrationsverzeichnis (`migrations/`) für die Versionsverfolgung von Schemaänderungen erstellt
- Automatische Migration-Generierung aus SQLAlchemy-Modellen konfiguriert

### Berechtigungen und Konfiguration
- Erweiterte Datenbankberechtigungen für `apiuser` (CREATE, ALTER, DROP, etc.)
- Korrekte Passwort-Synchronisation zwischen Containern und Datenbankbenutzer
- Migrations-Dokumentation in Code-Kommentaren für bessere Nachvollziehbarkeit

## 5. Dokumentation

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
4. Datenbankmigration initialisieren (falls noch nicht geschehen):
   ```bash
   docker exec -it car_monitoring_backend_dev flask db init
   docker exec -it car_monitoring_backend_dev flask db migrate -m "Initial migration" 
   docker exec -it car_monitoring_backend_dev flask db upgrade
   ```
5. Frontend lokal ausführen: `cd frontend && npm run dev`

## Bekannte Probleme und Lösungen

### Berechtigungsprobleme mit der Datenbank
Bei Fehlern wie `Access denied for user 'apiuser'@'xxx.xxx.xxx.xxx'`:
1. Überprüfe die Passwörter in der `.env`-Datei und in `init.sql`
2. Führe folgenden Befehl aus, um die Berechtigungen zu aktualisieren:
   ```bash
   docker exec -i car_monitoring_db_dev mysql -uroot -p"IHR_ROOT_PASSWORT" -e "GRANT ALL PRIVILEGES ON carmonitoring.* TO 'apiuser'@'%'; FLUSH PRIVILEGES;"
   ```
3. Falls nötig, setze das Passwort für den apiuser zurück:
   ```bash
   docker exec -i car_monitoring_db_dev mysql -uroot -p"IHR_ROOT_PASSWORT" -e "ALTER USER 'apiuser'@'%' IDENTIFIED BY 'IHR_API_PASSWORT'; FLUSH PRIVILEGES;"
   ```

### Module nicht gefunden
Wenn Python-Module trotz Eintrag in `requirements.txt` nicht gefunden werden:
1. Container neu bauen mit:
   ```bash
   docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up --build -d
   ```
2. Bei Bedarf in den Container einsteigen und prüfen:
   ```bash
   docker exec -it car_monitoring_backend_dev pip list | grep flask-migrate
   ```
