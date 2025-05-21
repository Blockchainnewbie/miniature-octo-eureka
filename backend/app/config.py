"""
Konfigurationsmodul für die Flask-Anwendung.

Dieses Modul definiert verschiedene Konfigurationsklassen für unterschiedliche
Umgebungen (Entwicklung, Test, Produktion) und stellt allgemeine sowie 
JWT-spezifische Einstellungen bereit.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
import pytest
from app.extensions import db

# Lade Umgebungsvariablen aus .env-Datei
load_dotenv()

class Config:
    """
    Basis-Konfigurationsklasse mit gemeinsamen Einstellungen für alle Umgebungen.
    
    Enthält allgemeine Flask-Konfigurationen sowie spezifische Einstellungen
    für die JWT-Authentifizierung wie Token-Lebenszeiten und Cookie-Sicherheit.
    """
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    # Allgemeine Konfiguration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT-Konfiguration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)  # Separate Secret für JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)  # Access-Tokens: 15 Minuten
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # Refresh-Tokens: 30 Tage
    JWT_TOKEN_LOCATION = ['headers', 'cookies']       # Wo nach Tokens gesucht wird
    JWT_COOKIE_SECURE = False                         # In Produktion auf True setzen
    JWT_COOKIE_CSRF_PROTECT = True                    # CSRF-Schutz für Cookies
    JWT_COOKIE_SAMESITE = 'Lax'                       # SameSite-Richtlinie

class DevelopmentConfig(Config):
    """
    Konfiguration für die Entwicklungsumgebung.
    
    Aktiviert Debug-Modus und verwendet die lokale Entwicklungsdatenbank.
    """
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL',
        'mysql+pymysql://user:password@db/carmonitoring')

class TestingConfig(Config):
    """
    Konfiguration für die Testumgebung.
    
    Aktiviert den Test-Modus und verwendet eine separate Test-Datenbank,
    um die Hauptdatenbank nicht zu beeinträchtigen.
    SQLite In-Memory-Datenbank für einfaches Testen ohne externe DB-Abhängigkeiten.
    """
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # CSRF-Schutz für Tests deaktivieren
    JWT_COOKIE_CSRF_PROTECT = False


class ProductionConfig(Config):
    """
    Konfiguration für die Produktionsumgebung.
    
    Verwendet erhöhte Sicherheitseinstellungen wie HTTPS-Only-Cookies
    und bezieht die Datenbank-URL aus Umgebungsvariablen.
    """
    # In der Produktion müssen sichere Einstellungen verwendet werden
    JWT_COOKIE_SECURE = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

# Konfiguration je nach Umgebung auswählen
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def init_extensions(app):
    """
    Initialisiert alle Flask-Erweiterungen für die Anwendung.
    
    Args:
        app: Die Flask-Anwendungsinstanz
    """
    # Hier können Erweiterungen wie SQLAlchemy, JWT, etc. initialisiert werden
    # Beispiel: db.init_app(app)
    pass

def create_app(config_name='default'):
    """
    App-Factory-Funktion, die die Flask-Anwendung erstellt und konfiguriert.
    
    Args:
        config_name: Name der zu verwendenden Konfiguration (development, testing, production)
        
    Returns:
        Die konfigurierte Flask-App
    """
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    
    # Erweiterungen initialisieren
    init_extensions(app)
    
    # Blueprints registrieren
    from app.auth import auth_bp  # Importiere den Auth-Blueprint
    app.register_blueprint(auth_bp, url_prefix='/api/auth')  # Registriere ihn unter /api/auth
    
    return app

@pytest.fixture
def app():
    """Erstellt und konfiguriert eine Flask-App für Tests"""
    app = create_app('testing')
    print(f"DEBUGGING: Test-App erstellt mit ID {id(app)}")
    
    # App-Kontext hinzufügen
    with app.app_context():
        # Stelle sicher, dass die Datenbank existiert
        db.create_all()
        print("DEBUGGING: Datenbank-Tabellen erstellt")
        yield app
        # Aufräumen
        db.session.remove()
        db.drop_all()
        print("DEBUGGING: Datenbank aufgeräumt")

@pytest.fixture
def client(app):
    """Erstellt einen Test-Client"""
    return app.test_client()

# Ein einfacher Test zum Start
def test_app_exists(app):
    """Test, ob die App erstellt wird"""
    assert app is not None
