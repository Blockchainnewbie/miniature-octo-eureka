# To-Do Liste

## 22. Mai 2025

### Sicherheit
- [ ] Unterschiedliche Datenbankpasswörter einrichten:
  - [ ] Root-Benutzer (MYSQL_ROOT_PASSWORD) und reguläre Benutzer (MYSQL_PASSWORD) sollten unterschiedliche Passwörter verwenden
  - [ ] Docker-Compose-Dateien (`docker-compose.yml` und `docker-compose.ci.yml`) entsprechend anpassen
  - [ ] Umgebungsvariablen in der .env-Datei aktualisieren
  - [ ] GitHub Actions Secret für CI/CD einrichten

### GitHub Actions
- [ ] Sicherstellen, dass das DB_PASSWORD Secret in den GitHub Repository-Einstellungen konfiguriert ist
- [ ] Testen, ob die GitHub Actions mit den korrekten Umgebungsvariablen funktionieren

### Dokumentation
- [ ] Aktualisierte Umgebungsvariablen in der Dokumentation vermerken
