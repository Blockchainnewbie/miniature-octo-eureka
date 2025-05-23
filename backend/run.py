#!/usr/bin/env python
"""
Entry point für die Flask-Anwendung.

Diese Datei startet die Flask-Anwendung für die Entwicklung.
"""

import os
from app import create_app

# Bestimme die Konfiguration basierend auf der Umgebungsvariable
config_name = os.environ.get('FLASK_ENV', 'development')

# Erstelle die App-Instanz
app = create_app(config_name)

if __name__ == '__main__':
    # Starte die Entwicklungsserver
    app.run(
        host='0.0.0.0',  # Macht die App für Docker-Container zugänglich
        port=5000,
        debug=True
    )
