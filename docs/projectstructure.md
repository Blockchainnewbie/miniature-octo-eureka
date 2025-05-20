## Verstehen der Projektarchitektur

Unser Projekt folgt einer klassischen 3-Schichten-Architektur:

1. **Präsentationsschicht** (Frontend): Vue.js-Anwendung
2. **Geschäftslogikschicht** (Backend): Flask-API
3. **Datenzugriffsschicht**: MySQL-Datenbank

### Backend (Flask)

Die Backend-Struktur sollte nach dem **MVC-Pattern** (Model-View-Controller) und **Clean Architecture** organisiert werden:

- **Models**: Repräsentieren die Datenstruktur (ORM mit SQLAlchemy)
- **Services**: Enthalten die Geschäftslogik
- **Controllers**: API-Endpunkte (in Flask: Routen)
- **Schemas**: Datenvalidierung und Serialisierung

#### Kernkomponenten im Backend:

1. **`app/__init__.py`**: 
   - Implementiert das Application Factory Pattern
   - Ermöglicht einfaches Testen und mehrere Konfigurationsumgebungen
   - Initialisiert Erweiterungen wie SQLAlchemy, JWT, CORS

2. **`app/models/`**: 
   - ORM-Modelle, die direkt Datenbanktabellen abbilden
   - Anwendung des Single Responsibility Principle (SRP)

3. **`app/services/`**:
   - Kapselt die Geschäftslogik
   - Trennt Datenbankoperationen von der Routenlogik (Dependency Inversion Principle)

4. **`app/api/`**:
   - Implementiert RESTful-Routen
   - Validiert Eingabedaten und bereitet Antworten vor
   - Delegiert komplexe Operationen an Services

### Frontend (Vue.js)

Das Frontend nutzt **Component-Based Architecture** mit **Flux Pattern** (durch Pinia):

- **Components**: Wiederverwendbare UI-Elemente
- **Views**: Seitenkomponenten
- **Stores**: Zentralisierter Zustand (Pinia)
- **Services**: API-Kommunikation

#### Kernkomponenten im Frontend:

1. **`src/components/`**:
   - Wiederverwendbare UI-Komponenten nach Single Responsibility Principle
   - Jede Komponente hat eine klar definierte Aufgabe

2. **`src/services/`**:
   - API-Kommunikation mit Axios
   - Trennung der Netzwerkkommunikation von der UI-Logik

3. **`src/stores/`**:
   - Zentralisierte Zustandsverwaltung mit Pinia
   - Ermöglicht zustandsbezogene Logik von UI-Komponenten zu trennen

### Docker-Konfiguration

Die docker-compose.yml dient mehreren Zwecken:

1. **Entwicklungsumgebung**: Definiert die drei Hauptservices (backend, frontend, db)
2. **Service-Isolation**: Jeder Dienst läuft in seinem eigenen Container
3. **Umgebungsvariablen**: Konfiguration über Umgebungsvariablen (z.B. Datenbankverbindung)
4. **Persistenz**: Volume für Datenbankdaten

Die Multi-Stage-Builds in Dockerfiles folgen Best Practices:
- Entwicklungsumgebung mit Hot Reloading
- Produktionsumgebung mit optimierten Builds

### SOLID-Prinzipien im Projekt

1. **Single Responsibility**: Jede Klasse/Komponente hat eine Aufgabe
2. **Open/Closed**: Erweiterbar ohne bestehenden Code zu ändern (z.B. neue Sensor-Typen)
3. **Liskov Substitution**: Basisklassen können durch abgeleitete Klassen ersetzt werden
4. **Interface Segregation**: Kleine, spezifische Schnittstellen statt einer großen
5. **Dependency Inversion**: Abhängigkeit von Abstraktionen, nicht von konkreten Klassen

### Clean Code-Aspekte

- **Aussagekräftige Namen**: Variablen, Funktionen, Klassen eindeutig benennen
- **Einheitlicher Stil**: ESLint für JavaScript/TypeScript, flake8 für Python
- **DRY-Prinzip**: Wiederverwendbare Funktionen und Komponenten
- **Kurze Funktionen**: Mit klarer Einzelverantwortung
- **Docstrings**: Jede Funktion/Klasse gut dokumentieren
