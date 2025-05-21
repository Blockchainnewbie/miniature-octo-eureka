"""
Flask-Erweiterungen für die Anwendung.

Dieses Modul initialisiert und konfiguriert alle Flask-Erweiterungen, die in der
Anwendung verwendet werden, wie SQLAlchemy für Datenbankzugriff und 
Flask-JWT-Extended für die Token-basierte Authentifizierung.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

# Erweiterungen initialisieren
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def init_extensions(app):
    """
    Initialisiert alle Flask-Erweiterungen mit der App-Instanz.
    
    Args:
        app: Die Flask-App-Instanz, mit der die Erweiterungen initialisiert werden sollen
    """
    print("Initialisiere Erweiterungen für App:", app)
    
    # Überprüfe, ob die SQLALCHEMY_DATABASE_URI gesetzt ist
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        print("WARNUNG: SQLALCHEMY_DATABASE_URI ist nicht gesetzt!")
        if app.config.get('TESTING'):
            print("Setze Test-Datenbank-URI auf SQLite In-Memory")
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        else:
            print("Setze Standard-Datenbank-URI")
            app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://user:password@db/carmonitoring'
    
    print(f"Verwende Datenbank: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    db.init_app(app)
    print("SQLAlchemy initialisiert:", db)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # JWT-Callbacks konfigurieren
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """
        Bestimmt, welcher Wert als Identity im JWT-Token gespeichert wird.
        In diesem Fall die user_id aus dem User-Objekt.
        
        Args:
            user: Ein User-Objekt, ein Dictionary mit einer ID oder direkt eine ID (int oder str)
            
        Returns:
            Die ID des Benutzers als String (JWT erwartet einen String)
        """
        if isinstance(user, dict):
            return str(user.get('id'))
        elif isinstance(user, (int, str)):
            # Wenn user bereits eine ID (int oder str) ist, wandeln wir sie in einen String um
            return str(user)
        # Sonst handelt es sich um ein User-Objekt, von dem wir die ID nehmen
        return str(user.id)
        
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """
        Lädt ein User-Objekt basierend auf der im JWT gespeicherten Identity.
        Wird verwendet, wenn `current_user` in Endpoints aufgerufen wird.
        
        Args:
            _jwt_header: Der Header-Teil des JWT (nicht verwendet)
            jwt_data: Der Payload-Teil des JWT
            
        Returns:
            Das User-Objekt oder None, wenn kein Benutzer gefunden wurde
        """
        from app.models.user import User
        identity = jwt_data["sub"]
        # Identity ist jetzt ein String, also wandeln wir ihn zurück in einen int für die Datenbankabfrage
        try:
            user_id = int(identity)
            return User.query.filter_by(id=user_id).one_or_none()
        except (ValueError, TypeError):
            # Wenn identity kein int ist, geben wir None zurück
            return None
    
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """
        Überprüft, ob ein JWT-Token widerrufen wurde.
        Wird bei jedem geschützten Endpunkt aufgerufen.
        
        Args:
            jwt_header: Der Header-Teil des JWT
            jwt_payload: Der Payload-Teil des JWT
            
        Returns:
            True wenn der Token widerrufen wurde, sonst False
        """
        from app.models.refresh_token import RefreshToken
        
        # Bei Access-Token: Nichts zu tun, da wir keine Blacklist für Access-Tokens führen
        if jwt_payload["type"] == "access":
            return False
            
        # Bei Refresh-Token: Überprüfe, ob er in der Datenbank widerrufen wurde
        jti = jwt_payload["jti"]  # JWT ID
        token = RefreshToken.query.filter_by(token=jti, revoked=True).one_or_none()
        return token is not None
