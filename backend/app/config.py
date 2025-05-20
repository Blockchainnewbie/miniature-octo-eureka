import os
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus .env-Datei
load_dotenv()

class Config(object):
    """Basis-Konfigurationsklasse für die Anwendung."""
    
    # Secret Key für JWT-Generierung
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'geheim-schluessel-muss-in-produktion-geaendert-werden'
    
    # MySQL-Konfiguration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'mysql://apiuser:{}@db:3306/carmonitoring'.format(os.environ.get('DB_PASSWORD', 'password'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT-Konfiguration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 Stunde
    JWT_REFRESH_TOKEN_EXPIRES = 86400 * 30  # 30 Tage

class DevelopmentConfig(Config):
    """Entwicklungskonfiguration mit Debug-Modus."""
    DEBUG = True

class TestingConfig(Config):
    """Testkonfiguration mit Testdatenbank."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'mysql://apiuser:{}@db:3306/carmonitoring_test'.format(os.environ.get('DB_PASSWORD', 'password'))
    
class ProductionConfig(Config):
    """Produktionskonfiguration."""
    DEBUG = False
    
    # Sicherheitsrelevante Einstellungen
    PROPAGATE_EXCEPTIONS = True
