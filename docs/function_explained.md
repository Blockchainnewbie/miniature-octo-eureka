# Funktionsdokumentation

Diese Dokumentation bietet eine detaillierte Beschreibung aller wichtigen Funktionen in der Codebasis des Projekts miniature-octo-eureka.

## Backend-Funktionen

### Application Factory

#### `create_app(config_name='default')`
**Datei:** `backend/app/__init__.py`

Diese Funktion implementiert das Application Factory Pattern und erstellt eine konfigurierte Flask-Anwendung.

**Parameter:**
- `config_name` (str, optional): Name der zu verwendenden Konfiguration ('development', 'testing', 'production'). Standard ist 'default'.

**Rückgabewert:**
- Eine konfigurierte Flask-App-Instanz.

**Beschreibung:**
- Erstellt eine neue Flask-App-Instanz
- Lädt die Konfiguration basierend auf dem übergebenen config_name
- Initialisiert alle Flask-Erweiterungen (SQLAlchemy, JWT, etc.)
- Registriert alle benötigten Blueprints (derzeit nur auth_bp)

**Verwendung:**
```python
from app import create_app

app = create_app('development')  # Erstellt eine Entwicklungsumgebung
# oder
app = create_app('testing')  # Erstellt eine Testumgebung
# oder
app = create_app()  # Verwendet die Standardkonfiguration (development)
```

---

### Erweiterungen

#### `init_extensions(app)`
**Datei:** `backend/app/extensions.py`

Diese Funktion initialisiert alle Flask-Erweiterungen mit der übergebenen App-Instanz.

**Parameter:**
- `app` (Flask): Die Flask-App-Instanz, mit der die Erweiterungen initialisiert werden sollen.

**Beschreibung:**
- Initialisiert SQLAlchemy, JWTManager und Flask-Migrate mit der App
- Konfiguriert JWT-Callbacks für Benutzeridentität, Benutzerlookup und Token-Blacklisting
- Stellt sicher, dass eine gültige Datenbankverbindung konfiguriert ist

---

#### `user_identity_lookup(user)`
**Datei:** `backend/app/extensions.py`

Diese Funktion bestimmt, welcher Wert als Identity im JWT-Token gespeichert wird.

**Parameter:**
- `user`: Ein User-Objekt, ein Dictionary mit einer ID oder direkt eine ID (int oder str)

**Rückgabewert:**
- Die ID des Benutzers als String

**Beschreibung:**
- Extrahiert die Benutzer-ID aus verschiedenen Eingabetypen
- Wandelt die ID immer in einen String um (JWT erwartet einen String)

---

#### `user_lookup_callback(_jwt_header, jwt_data)`
**Datei:** `backend/app/extensions.py`

Diese Funktion lädt ein User-Objekt basierend auf der im JWT gespeicherten Identity.

**Parameter:**
- `_jwt_header`: Der Header-Teil des JWT (nicht verwendet)
- `jwt_data`: Der Payload-Teil des JWT

**Rückgabewert:**
- Das User-Objekt oder None, wenn kein Benutzer gefunden wurde

**Beschreibung:**
- Extrahiert die Benutzer-ID aus dem JWT-Token
- Sucht den entsprechenden Benutzer in der Datenbank
- Macht das Benutzerobjekt über current_user in geschützten Routen verfügbar

---

#### `check_if_token_revoked(jwt_header, jwt_payload)`
**Datei:** `backend/app/extensions.py`

Diese Funktion überprüft, ob ein JWT-Token widerrufen wurde.

**Parameter:**
- `jwt_header`: Der Header-Teil des JWT
- `jwt_payload`: Der Payload-Teil des JWT

**Rückgabewert:**
- `True` wenn der Token widerrufen wurde, sonst `False`

**Beschreibung:**
- Prüft bei Access-Tokens: Keine Blacklist-Prüfung (immer False)
- Prüft bei Refresh-Tokens: Suche in der Datenbank nach widerrufenen Tokens

---

### Auth Routes

#### `test_route()`
**Datei:** `backend/app/auth/routes.py`

Einfache Testroute zum Prüfen, ob der Auth-Blueprint funktioniert.

**Route:** `GET /api/auth/test`

**Rückgabewert:**
- JSON-Response mit einer Bestätigungsnachricht

---

#### `protected()`
**Datei:** `backend/app/auth/routes.py`

Geschützte Test-Route, die nur mit gültigem Access-Token zugänglich ist.

**Route:** `GET /api/auth/protected`

**Zugriffsschutz:**
- Erfordert gültigen JWT Access-Token (`@jwt_required()`)

**Rückgabewert:**
- JSON-Response mit Benutzerinformationen des authentifizierten Users

**Beschreibung:**
- Demonstriert die Verwendung von `@jwt_required()`
- Greift auf den aktuellen Benutzer mit `current_user` zu

---

#### `create_user()`
**Datei:** `backend/app/auth/routes.py`

Endpunkt zum Erstellen eines neuen Benutzers (Admin-Funktion).

**Route:** `POST /api/auth/admin/users`

**Zugriffsschutz:**
- Erfordert gültigen JWT Access-Token (`@jwt_required()`)

**Request-Parameter (JSON):**
- `username`: Benutzername des neuen Benutzers
- `password`: Passwort des neuen Benutzers
- `role`: Rolle des neuen Benutzers (optional, Standard ist 'user')

**Rückgabewert:**
- Bei Erfolg: JSON-Response mit Bestätigungsnachricht und Benutzerdaten (201 Created)
- Bei Fehler: Fehlermeldung (400 Bad Request oder 409 Conflict)

**Beschreibung:**
- Prüft, ob der aktuelle Benutzer Admin-Rechte hat
- Validiert die Eingabedaten
- Erstellt einen neuen Benutzer mit gehashtem Passwort
- Speichert den Benutzer in der Datenbank

---

#### `login()`
**Datei:** `backend/app/auth/routes.py`

Authentifiziert Benutzer und gibt Tokens aus.

**Route:** `POST /api/auth/login`

**Request-Parameter (JSON):**
- `username`: Benutzername
- `password`: Passwort

**Rückgabewert:**
- Bei Erfolg: JSON-Response mit Access-Token und Benutzerinformationen
- Bei Fehler: Fehlermeldung (401 Unauthorized)

**Beschreibung:**
- Validiert die Benutzerdaten gegen die Datenbank
- Erstellt bei Erfolg einen Access-Token und einen Refresh-Token
- Speichert den Refresh-Token in der Datenbank
- Sendet den Refresh-Token als HTTP-Only-Cookie
- Sendet den Access-Token als JSON-Response

---

#### `refresh()`
**Datei:** `backend/app/auth/routes.py`

Erneuert den Access-Token mit einem gültigen Refresh-Token.

**Route:** `POST /api/auth/refresh`

**Zugriffsschutz:**
- Erfordert gültigen JWT Refresh-Token (`@jwt_required(refresh=True)`)

**Rückgabewert:**
- Bei Erfolg: JSON-Response mit neuem Access-Token
- Bei Fehler: Fehlermeldung (401 Unauthorized)

**Beschreibung:**
- Extrahiert die Benutzer-ID aus dem Refresh-Token
- Prüft, ob der Benutzer noch existiert
- Erstellt einen neuen Access-Token mit derselben Identität

---

#### `logout()`
**Datei:** `backend/app/auth/routes.py`

Meldet einen Benutzer ab und widerruft seinen Refresh-Token.

**Route:** `POST /api/auth/logout`

**Zugriffsschutz:**
- Erfordert gültigen JWT Refresh-Token (`@jwt_required(refresh=True)`)

**Rückgabewert:**
- JSON-Response mit Bestätigung der Abmeldung

**Beschreibung:**
- Extrahiert den Token-Identifikator aus dem JWT
- Markiert den Token in der Datenbank als widerrufen
- Löscht das Refresh-Token-Cookie auf dem Client-Gerät

---

### Models

#### `User` Klasse
**Datei:** `backend/app/models/user.py`

Benutzerdatenmodell für die Authentifizierung und Benutzerverwaltung.

**Attribute:**
- `id` (Integer): Primärschlüssel, automatisch inkrementiert
- `username` (String): Eindeutiger Benutzername
- `_password` (String): Gehashtes Passwort (nicht direkt zugänglich)
- `role` (Enum): Benutzerrolle (user oder admin)
- `created_at` (DateTime): Zeitpunkt der Benutzererstellung
- `refresh_tokens` (Relationship): One-to-Many-Beziehung zu RefreshToken

**Methoden:**
- `password` (Property): Getter, der einen Fehler wirft (Passwörter können nicht ausgelesen werden)
- `password` (Setter): Setzt das Passwort als sicheren Argon2-Hash
- `verify_password(password)`: Überprüft ein Passwort gegen den gespeicherten Hash
- `to_dict()`: Konvertiert das Benutzerobjekt in ein Dictionary für API-Responses
- `__repr__()`: String-Repräsentation für Debugging

---

#### `RefreshToken` Klasse
**Datei:** `backend/app/models/refresh_token.py`

Modell zur Verwaltung von JWT Refresh-Tokens.

**Attribute:**
- `token_id` (String): Primärschlüssel, UUID-String
- `user_id` (Integer): Fremdschlüssel zur users-Tabelle
- `token` (String): Der Token-String
- `issued_at` (DateTime): Zeitpunkt der Token-Ausstellung
- `expires_at` (DateTime): Ablaufzeitpunkt des Tokens
- `revoked` (Boolean): Flag, ob der Token widerrufen wurde
- `user` (Relationship): Beziehung zum User-Objekt

**Methoden:**
- `is_expired()`: Prüft, ob der Token abgelaufen ist
- `is_valid()`: Prüft, ob der Token gültig ist (nicht abgelaufen und nicht widerrufen)
- `revoke()`: Widerruft den Token (z.B. bei Logout)
- `__repr__()`: String-Repräsentation für Debugging

---

#### `cleanup_expired_tokens()`
**Datei:** `backend/app/models/__init__.py`

Diese Funktion löscht alle abgelaufenen oder widerrufenen Tokens aus der Datenbank.

**Rückgabewert:**
- `True` bei Erfolg, `False` bei Fehler

**Beschreibung:**
- Filtert alle abgelaufenen oder widerrufenen Tokens
- Löscht diese aus der Datenbank
- Kann regelmäßig über einen Scheduler aufgerufen werden

---

## Test-Funktionen

### Authentication Tests

#### `app()` (Pytest Fixture)
**Datei:** `backend/tests/test_auth.py`

Diese Fixture erstellt und konfiguriert eine Flask-App für Tests.

**Rückgabewert:**
- Eine konfigurierte Flask-App-Instanz

**Beschreibung:**
- Erstellt eine Test-App mit In-Memory-SQLite
- Erstellt alle Datenbanktabellen
- Räumt nach dem Test auf

---

#### `client(app)` (Pytest Fixture)
**Datei:** `backend/tests/test_auth.py`

Diese Fixture erstellt einen Test-Client für die gegebene App.

**Parameter:**
- `app`: Die Flask-App-Instanz aus der app-Fixture

**Rückgabewert:**
- Ein Flask-Test-Client

**Beschreibung:**
- Konfiguriert den Client, um Cookies zu verfolgen
- Erstellt einen Testbenutzer
- Testet die Authentication-Funktionalität

---

*Dokumentation erstellt: 21.05.2025*
