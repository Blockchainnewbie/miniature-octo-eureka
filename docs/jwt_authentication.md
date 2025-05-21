# JWT Authentifizierungssystem Dokumentation

## Überblick

Diese Dokumentation beschreibt die JWT-basierte Authentifizierungslösung, die für unser Fahrzeugüberwachungssystem implementiert wurde. Das System nutzt JWT (JSON Web Tokens) für eine sichere, zustandslose Authentifizierung mit Refresh-Token-Mechanismus.

## System-Architektur

Das Authentifizierungssystem basiert auf einer 3-Tier-Architektur:

```
Client ↔ Flask API (mit JWT-Auth) ↔ MySQL Datenbank
```

### Komponenten

1. **Datenbankmodelle**:
   - `User`: Speichert Benutzerinformationen und Passwort-Hashes
   - `RefreshToken`: Speichert und verwaltet Refresh-Tokens für Token-Erneuerung

2. **Authentifizierungs-Blueprint**:
   - Stellt alle Auth-Endpunkte unter `/api/auth` bereit
   - Implementiert Login, Token-Refresh und Logout

3. **JWT-Mechanismus**:
   - Access-Tokens: Kurzlebig (15 Minuten), für API-Zugriff
   - Refresh-Tokens: Langlebig (30 Tage), für Token-Erneuerung

## Datenmodelle

### Benutzermodell (User)

Das `User`-Modell ist für die Speicherung von Benutzerinformationen und sicheres Passwort-Handling zuständig:

```python
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column('user_id', db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    _password = db.Column('password_hash', db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.user)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Beziehung zu Refresh-Tokens
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", 
                                    cascade="all, delete-orphan")
                                    
    # Hybrid-Property für sicheres Passwort-Handling
    @hybrid_property
    def password(self):
        raise AttributeError('Passwort kann nicht gelesen werden')
        
    @password.setter
    def password(self, password):
        self._password = ph.hash(password)
        
    def verify_password(self, password):
        try:
            ph.verify(self._password, password)
            return True
        except VerifyMismatchError:
            return False
```

Sicherheitsmerkmale:
- Passwörter werden mit Argon2 gehasht (empfohlener State-of-the-Art-Algorithmus)
- Direktes Auslesen des Passwort-Hashes ist nicht möglich
- Passwort-Verifizierung erfolgt sicher durch die `verify_password`-Methode

### Refresh-Token-Modell

Das `RefreshToken`-Modell verfolgt und verwaltet JWT-Refresh-Tokens:

```python
class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'
    token_id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    token = db.Column(db.String(255), nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    
    # Beziehung zum User-Modell
    user = db.relationship("User", back_populates="refresh_tokens")
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self):
        return not self.is_expired() and not self.revoked
```

## Auth-Routen

Der Auth-Blueprint stellt folgende Endpunkte bereit:

### 1. Login (`/api/auth/login`, POST)

**Funktionalität**: Authentifiziert Benutzer und gibt Tokens aus.

**Request**:
```json
{
  "username": "benutzername",
  "password": "passwort"
}
```

**Response**:
```json
{
  "message": "Anmeldung erfolgreich",
  "user": {
    "user_id": 1,
    "username": "benutzername",
    "role": "user",
    "created_at": "2023-05-21T10:00:00"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Prozess**:
1. Validiert Benutzername/Passwort
2. Erstellt Access-Token (im Response) und Refresh-Token (als HttpOnly-Cookie)
3. Speichert Refresh-Token in der Datenbank

### 2. Token-Refresh (`/api/auth/refresh`, POST)

**Funktionalität**: Erneuert Access-Tokens mit einem gültigen Refresh-Token.

**Request**: Keine Body-Daten erforderlich, Refresh-Token wird aus Cookie gelesen.

**Response**:
```json
{
  "message": "Token erfolgreich erneuert",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Prozess**:
1. Validiert den Refresh-Token aus dem Cookie
2. Erstellt einen neuen Access-Token mit derselben Benutzer-Identität

### 3. Logout (`/api/auth/logout`, POST)

**Funktionalität**: Meldet Benutzer ab und widerruft Tokens.

**Request**: Keine Body-Daten erforderlich, Refresh-Token wird aus Cookie gelesen.

**Response**:
```json
{
  "message": "Abmeldung erfolgreich"
}
```

**Prozess**:
1. Markiert den Refresh-Token in der Datenbank als widerrufen
2. Löscht das Refresh-Token-Cookie

### 4. Geschützte Route (`/api/auth/protected`, GET)

**Funktionalität**: Dient zum Testen der JWT-Authentifizierung.

**Request**: Erfordert Authorization-Header mit Bearer-Token.

**Response**:
```json
{
  "message": "Du hast Zugriff auf eine geschützte Route",
  "user": {
    "user_id": 1,
    "username": "benutzername",
    "role": "user",
    "created_at": "2023-05-21T10:00:00"
  }
}
```

## JWT-Konfiguration

Die JWT-Konfiguration in `config.py` definiert wichtige Parameter:

```python
# JWT-Konfiguration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_TOKEN_LOCATION = ['headers', 'cookies']
JWT_COOKIE_SECURE = False  # True in Produktion
JWT_COOKIE_CSRF_PROTECT = True
JWT_COOKIE_SAMESITE = 'Lax'
```

## Sicherheitsmaßnahmen

Das System implementiert mehrere wichtige Sicherheitsmaßnahmen:

1. **Passwort-Sicherheit**:
   - Argon2-Hashing (sicherer als bcrypt/PBKDF2)
   - Keine Klartext-Passwörter im Code oder in der Datenbank

2. **Token-Sicherheit**:
   - Kurzlebige Access-Tokens (15 Minuten)
   - HttpOnly-Cookies für Refresh-Tokens (XSS-Schutz)
   - Datenbank-Tracking für Token-Widerrufung

3. **CSRF-Schutz**:
   - SameSite-Cookie-Einstellungen
   - CSRF-Protection für Cookies

4. **Allgemeine Sicherheit**:
   - Keine sensiblen Daten in Responses
   - Unspezifische Fehlermeldungen bei Login-Fehlern

## Nutzung in anderen Komponenten

Um geschützte Routen in anderen Teilen der Anwendung zu erstellen:

```python
from flask_jwt_extended import jwt_required, current_user

@api.route('/some-protected-endpoint')
@jwt_required()  # Erfordert gültigen JWT-Token
def protected_endpoint():
    # current_user ist automatisch verfügbar
    user_id = current_user.id
    # Logik hier...
    return jsonify({"data": "Geschützte Daten"})
```

## Admin Funktionalität

**TO-DO:** Im Dashboard muss eine Funktion implementiert werden, mit der Administratoren neue Benutzerkonten anlegen können. Die öffentliche Registrierung ist deaktiviert.

## Frontend-Integration

Das Frontend muss:

1. **Login-Formular** bereitstellen und den erhaltenen Access-Token speichern
2. **Token-Management** implementieren:
   - Access-Token in localStorage oder sessionStorage speichern
   - Access-Token bei jeder API-Anfrage im Authorization-Header senden
   - Bei 401-Antworten einen Refresh-Request senden
3. **Logout-Funktionalität** bereitstellen, die den Logout-Endpunkt aufruft

## Testfall-Beispiele

### Login-Test

```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username": "admin", "password": "sicheres_passwort"}' \
-v
```

### Geschützte Route testen

```bash
curl -X GET http://localhost:5000/api/auth/protected \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token erneuern

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
-b "refresh_token_cookie=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
-b "refresh_token_cookie=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Implementierte und geplante Arbeiten

### Implementiert

- ✅ Benutzerdatenmodell (User)
- ✅ Refresh-Token-Modell
- ✅ JWT-Konfiguration und Callbacks
- ✅ Login-Endpunkt mit Token-Ausgabe
- ✅ Token-Refresh-Endpunkt
- ✅ Logout-Endpunkt mit Token-Widerruf
- ✅ Geschützte Routen (Zugriffsschutz mit @jwt_required())

### Geplant

- ⬜ Admin-Interface zur Benutzerverwaltung
- ⬜ Frontend-Integration der JWT-Authentication
- ⬜ Rollenbasierte Zugriffskontrolle erweitern
- ⬜ Password-Reset-Funktionalität
- ⬜ Rate-Limiting für Login-Versuche

## Weitere Informationen

Für ausführlichere Details zu den implementierten Funktionen siehe:
- [Funktionsdokumentation](function_explained.md)
- [Testdokumentation](test_documentation.md)
- [Diagramme](diagrams.md) - Enthält ein Ablaufdiagramm des Authentifizierungsprozesses

---

Dokumentation erstellt am: 21. Mai 2025
Letzte Aktualisierung: 21. Mai 2025
