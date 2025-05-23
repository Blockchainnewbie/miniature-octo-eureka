#!/bin/bash
# Erstelle API-Benutzer mit dem gleichen Passwort wie in der .env-Datei

set -e

# Verwende das DB_PASSWORD aus der Umgebung
API_PASSWORD="${DB_PASSWORD:-carmonitoring123!}"

echo "Creating apiuser with configured password..."

# SQL-Kommando ausführen
mysql -h db -u root -p"${API_PASSWORD}" -e "
CREATE USER IF NOT EXISTS 'apiuser'@'%' IDENTIFIED BY '${API_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON carmonitoring.* TO 'apiuser'@'%';
FLUSH PRIVILEGES;
"

echo "API user created successfully!"
