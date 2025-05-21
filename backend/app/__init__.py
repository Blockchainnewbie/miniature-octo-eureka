from flask import Flask  # Import Flask für die Webanwendung
from flask_sqlalchemy import SQLAlchemy  # ORM für Datenbankoperationen
from flask_jwt_extended import JWTManager  # Für JWT-basierte Authentifizierung
from flask_cors import CORS  # Cross-Origin Resource Sharing Unterstützung
from config import Config  # Importiere Konfigurationseinstellungen

# Initialisiere Erweiterungen ohne App-Kontext
db = SQLAlchemy()  # Datenbank-Instanz
jwt = JWTManager()  # JWT-Manager-Instanz

def create_app(config_class=Config):
    """
    Factory-Funktion zur Erstellung und Konfiguration der Flask-Anwendung.
    
    Args:
        config_class: Konfigurationsklasse für die Anwendung (Standard: Config)
        
    Returns:
        Flask: Konfigurierte Flask-Anwendungsinstanz
    """
    app = Flask(__name__)  # Erstelle Flask-App
    app.config.from_object(config_class)  # Lade Konfiguration aus der angegebenen Klasse

    # Initialisiere Erweiterungen mit App-Kontext
    db.init_app(app)  # Verbinde SQLAlchemy mit der App
    jwt.init_app(app)  # Verbinde JWT-Manager mit der App
    CORS(app)  # Aktiviere CORS für alle Routen

    # Registriere Blueprints für modulare Struktur
    from app.api import bp as api_bp  # Importiere API Blueprint
    app.register_blueprint(api_bp, url_prefix='/api')  # Registriere mit Präfix '/api'

    return app  # Gebe konfigurierte App zurück
