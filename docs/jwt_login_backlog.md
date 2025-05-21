# JWT-Login Feature – Zwischenstand & Backlog

## Zusammenfassung bisheriger Arbeiten

- Die Datenbankstruktur für die `users`-Tabelle wurde festgelegt und umgesetzt.
- Das User-Modell in Flask/SQLAlchemy wurde exakt an die Datenbank angepasst (Felder: user_id, username, password_hash, role, created_at).
- Sichere Passwortbehandlung mit Argon2-Hashing und Verifizierung wurde implementiert.
- Die Beziehung zu RefreshTokens wurde vorbereitet.
- Methoden zur sicheren Serialisierung (`to_dict`) und Passwortprüfung wurden mit Docstrings dokumentiert.
- Clean-Code- und Sicherheitsprinzipien (z.B. kein Klartext-Passwort, keine sensiblen Daten in API-Responses) wurden eingehalten.

---

## Backlog für JWT-Login-Feature

1. **RefreshToken-Modell anlegen**
   - Datenbankmodell für Refresh Tokens erstellen (inkl. ForeignKey auf User, Token-String, Ablaufdatum, Blacklist-Flag).

2. **JWT-Konfiguration in Flask**
   - Flask-JWT-Extended in der App initialisieren und konfigurieren.
   - Secret Key und Token-Lebensdauer in der Konfiguration festlegen.

3. **Auth-Blueprint: Endpoints implementieren**
   - `/register`: Benutzerregistrierung mit Hashing und Validierung.
   - `/login`: Login-Endpoint, der bei Erfolg einen JWT-Access-Token und einen Refresh-Token ausgibt.
   - `/refresh`: Endpoint zum Erneuern des Access-Tokens mit gültigem Refresh-Token.
   - `/logout`: Refresh-Token invalidieren (Blacklist).

4. **Token-Handling**
   - Access-Token und Refresh-Token generieren und sicher speichern/ausgeben.
   - Refresh-Token als HttpOnly-Cookie setzen.

5. **Sicherheit & Fehlerbehandlung**
   - Fehlerhafte Logins und Token-Fehler sauber behandeln.
   - Rate-Limiting und Logging für Loginversuche (optional).

6. **Tests**
   - Unit- und Integrationstests für alle Authentifizierungsrouten und Token-Logik.

7. **Dokumentation**
   - API-Dokumentation für Auth-Endpoints und Token-Handling ergänzen.

## Abgeschlossene Arbeiten (21.05.2025)

- ✅ Umfassende Test-Dokumentation erstellt (siehe [test_documentation.md](test_documentation.md))
- ✅ Detaillierte Funktionsdokumentation erstellt (siehe [function_explained.md](function_explained.md))
- ✅ JWT-Ablaufdiagramm und Datenbankschema erstellt (siehe [diagrams.md](diagrams.md))
- ✅ Klassen- und Strukturdiagramm hinzugefügt

## Nächste Schritte

1. Frontend-Integration der JWT-Authentication
2. Admin-Interface zur Benutzerverwaltung implementieren
3. Unit-Tests für die Frontend-Komponenten entwickeln

---

*Stand: 21. Mai 2025*
