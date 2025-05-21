# Test-Dokumentation für miniature-octo-eureka

Diese Dokumentation beschreibt die Testumgebung, die verfügbaren Tests und wie diese ausgeführt werden sollen.

## Testumgebung

Das Projekt verwendet `pytest` als Testframework und führt Tests in einer isolierten Umgebung aus. Für Datenbanktests wird eine SQLite In-Memory-Datenbank verwendet, um schnelle und isolierte Tests zu gewährleisten.

### Test-Konfiguration

Die Tests verwenden eine spezielle Konfigurationsklasse `TestingConfig` in `backend/app/config.py`, die folgende Eigenschaften hat:

- `TESTING = True`: Aktiviert den Test-Modus in Flask
- `SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'`: Verwendet eine In-Memory-SQLite-Datenbank
- `JWT_COOKIE_CSRF_PROTECT = False`: Deaktiviert CSRF-Schutz für einfacheres Testen

## Verfügbare Tests

Aktuell sind folgende Tests implementiert:

### Authentication Tests (`backend/tests/test_auth.py`)

Diese Tests überprüfen die Authentifizierungsfunktionalität des Systems:

| Test | Beschreibung |
|------|--------------|
| `test_app_exists` | Prüft, ob die Flask-App korrekt erstellt wird |
| `test_login_success` | Testet erfolgreiche Anmeldung mit gültigen Anmeldedaten |
| `test_login_invalid_credentials` | Prüft die korrekte Fehlerbehandlung bei ungültigen Anmeldedaten |
| `test_protected_route_with_token` | Überprüft den Zugriff auf geschützte Routen mit gültigem Token |
| `test_protected_route_without_token` | Stellt sicher, dass der Zugriff auf geschützte Routen ohne Token verweigert wird |
| `test_refresh_token` | Testet die Token-Erneuerungsfunktionalität |
| `test_logout` | Überprüft die Logout-Funktion und das Widerrufen von Tokens |

## Ausführung der Tests

### Lokal

Um die Tests lokal auszuführen, stehen folgende Möglichkeiten zur Verfügung:

1. **Direkt im Projektverzeichnis**:
   ```bash
   cd backend
   pytest
   ```

2. **Mit Detailausgabe**:
   ```bash
   cd backend
   pytest -v
   ```

3. **Einzelne Testdatei**:
   ```bash
   cd backend
   pytest tests/test_auth.py
   ```

4. **Einzelne Testfunktion**:
   ```bash
   cd backend
   pytest tests/test_auth.py::test_login_success
   ```

### Im Docker-Container

Die Tests können auch innerhalb des Docker-Containers ausgeführt werden:

1. **Alle Tests**:
   ```bash
   docker compose exec backend pytest
   ```

2. **Mit kompakter Ausgabe**:
   ```bash
   docker compose exec backend pytest -q
   ```

3. **Einzelne Testdatei**:
   ```bash
   docker compose exec backend pytest tests/test_auth.py
   ```

## Fixtures

Das Testframework verwendet folgende Fixtures:

### `app` Fixture

Diese Fixture erstellt und konfiguriert eine Flask-Anwendung für Testzwecke:
- Verwendet die Testkonfiguration mit In-Memory-SQLite
- Erstellt alle benötigten Datenbanktabellen
- Räumt nach dem Test auf, indem alle Tabellen gelöscht werden

### `client` Fixture

Diese Fixture erstellt einen Test-Client für die Flask-Anwendung:
- Konfiguriert den Client so, dass er Cookies verfolgt (wichtig für Token-Tests)
- Erstellt einen Testbenutzer mit Username 'testuser' und Passwort 'testpassword'
- Nutzt den Kontext der `app` Fixture

## Bewährte Praktiken für Tests

1. **Isolation**: Jeder Test sollte unabhängig und isoliert sein, ohne Abhängigkeiten zu anderen Tests.
2. **Vorbereitete Testdaten**: Fixtures sollten verwendet werden, um Testdaten bereitzustellen.
3. **Klare Assertions**: Jede Testfunktion sollte klare Assertions haben, die genau prüfen, was erwartet wird.
4. **Debugging**: Bei Problemen können Debug-Ausgaben mit `print()` eingefügt werden, wie in den bestehenden Tests zu sehen.
5. **Erweiterte Testfälle**: Für jeden Endpunkt sollten positive und negative Testfälle existieren.

## CI/CD Integration

Die Tests werden automatisch durch die GitHub Actions CI-Pipeline ausgeführt:
- Bei jedem Push auf die `main` und `dev` Branches
- Bei Pull Requests
- Sowohl direkt auf dem Host als auch im Docker-Container

## Zukünftige Test-Erweiterungen

- Frontend Unit-Tests mit Vitest oder Jest
- End-to-End-Tests mit Cypress oder Playwright
- Erweiterte Backend-Tests für neue Funktionalitäten
- Performance- und Lasttests
- Sicherheitstests

---

*Dokumentation erstellt: 21.05.2025*
