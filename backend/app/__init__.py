"""
Haupt-Initialisierungsmodul für die Flask-Anwendung.

Dieses Modul enthält die App-Factory und stellt die zentrale Konfiguration
und Initialisierung der Flask-Anwendung bereit.
"""
from flask import Flask  # Import Flask für die Webanwendung
from flask_cors import CORS  # Cross-Origin Resource Sharing Unterstützung
from app.config import config_by_name  # Importiere Konfigurationseinstellungen
from app.extensions import db, jwt, migrate, init_extensions # Importiere die Erweiterungen

# Diese Funktion wurde in app/extensions.py verschoben und wird von dort importiert

def create_app(config_name='default'):
    """
    App-Factory-Funktion, die die Flask-Anwendung erstellt und konfiguriert.
    
    Args:
        config_name: Name der zu verwendenden Konfiguration (development, testing, production)
        
    Returns:
        Die konfigurierte Flask-App
    """
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])  # Nutze config_name als Schlüssel
    
    print(f"DEBUG: Verwende Konfiguration {config_name}")
    print(f"DEBUG: SQLALCHEMY_DATABASE_URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    # Erweiterungen initialisieren
    init_extensions(app)
    
    # Blueprints registrieren
    from app.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app
