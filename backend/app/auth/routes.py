"""
Routen für die Benutzerauthentifizierung.

Dieses Modul enthält alle Endpunkte, die für die Benutzerauthentifizierung benötigt werden.
"""
from datetime import datetime, timezone
import uuid
from flask import jsonify, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, current_user, get_jwt_identity, get_jwt
)
# Importiert den Blueprint 'auth_bp' aus der __init__.py des aktuellen Pakets.
# Der Punkt (.) steht für das aktuelle Verzeichnis (hier: das auth-Modul).
# So wird sichergestellt, dass alle Routen in dieser Datei dem Blueprint zugeordnet werden.
from . import auth_bp
from app.extensions import db
from app.models.user import User
from app.models.refresh_token import RefreshToken

# Eine einfache Testroute zum Einstieg
@auth_bp.route('/test', methods=['GET'])
def test_route():
    """Einfache Testroute um zu prüfen, ob der Blueprint funktioniert."""
    return jsonify({"message": "Auth-Blueprint funktioniert!"})

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()  # Diese Route erfordert einen gültigen Access-Token
def protected():
    """
    Geschützte Test-Route, die nur mit gültigem Access-Token zugänglich ist.
    
    Diese Route demonstriert, wie JWT-geschützte Endpunkte funktionieren.
    Der Decorator @jwt_required() stellt sicher, dass nur Anfragen mit
    einem gültigen Access-Token akzeptiert werden.
    
    Returns:
        JSON-Response mit Benutzerinformationen des authentifizierten Users
    """
    # current_user wird automatisch von flask_jwt_extended geladen
    return jsonify({
        "message": "Du hast Zugriff auf eine geschützte Route",
        "user": current_user.to_dict() if current_user else {"id": get_jwt_identity()}
    })

@auth_bp.route('/admin/users', methods=['POST'])
@jwt_required()  # Nur für angemeldete Benutzer zugänglich
def create_user():
    """
    Erstellt einen neuen Benutzer (nur für Administratoren).
    
    Diese Route ist geschützt und nur für Benutzer mit Admin-Rolle zugänglich.
    Sie ermöglicht das manuelle Anlegen neuer Benutzerkonten im System.
    
    Returns:
        JSON-Response mit Bestätigung oder Fehlermeldung
    """
    # Prüfen, ob der aktuelle Benutzer Admin-Rechte hat
    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Keine Berechtigung"}), 403
        
    data = request.get_json()
    
    # Grundlegende Validierung
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Benutzername und Passwort erforderlich"}), 400
        
    # Überprüfen, ob Benutzer bereits existiert
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Benutzername bereits vergeben"}), 409
    
    # Neuen Benutzer erstellen
    new_user = User(
        username=data['username'],
        role=data.get('role', 'user')  # Standard ist 'user', kann aber vom Admin gesetzt werden
    )
    new_user.password = data['password']
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "Benutzer erfolgreich erstellt", 
        "user": new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authentifiziert einen Benutzer und gibt JWT-Tokens aus.
    
    Diese Route erwartet Benutzername und Passwort als JSON und führt folgende Schritte aus:
    1. Validiert die eingegebenen Daten
    2. Überprüft, ob der Benutzer existiert und das Passwort korrekt ist
    3. Erstellt bei Erfolg einen Access-Token und einen Refresh-Token
    4. Speichert den Refresh-Token in der Datenbank zur Nachverfolgung
    5. Gibt den Access-Token im JSON-Response zurück
    6. Setzt den Refresh-Token als sicheres HttpOnly-Cookie
    
    Returns:
        JSON-Response mit Token oder Fehlermeldung
    """
    # Daten aus dem Request-Body als JSON holen
    data = request.get_json()
    
    # Grundlegende Validierung: Prüfen ob alle nötigen Daten vorhanden sind
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Benutzername und Passwort erforderlich"}), 400
    
    # Benutzer in der Datenbank suchen
    user = User.query.filter_by(username=data['username']).first()
    
    # Prüfen, ob Benutzer existiert und Passwort korrekt ist
    if not user or not user.verify_password(data['password']):
        # Aus Sicherheitsgründen geben wir nicht an, ob der Benutzername oder das Passwort falsch ist
        return jsonify({"error": "Ungültige Anmeldeinformationen"}), 401
    
    # Access-Token erstellen, der die Benutzer-ID als Identität enthält
    # Dieser Token wird für API-Anfragen verwendet und hat eine kurze Lebensdauer
    access_token = create_access_token(identity=user.id)
    
    # Einen eindeutigen Refresh-Token-Wert generieren
    refresh_token_value = str(uuid.uuid4())
    
    # Ablaufdatum für den Refresh-Token berechnen
    expires_at = datetime.now(timezone.utc) + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
    
    # Refresh-Token in der Datenbank speichern zur Nachverfolgung und Widerrufung
    token = RefreshToken(
        token_id=str(uuid.uuid4()),  # Eindeutige ID für den Token
        user_id=user.id,
        token=refresh_token_value,
        expires_at=expires_at
    )
    db.session.add(token)
    db.session.commit()
    
    # Refresh-Token erstellen, der die Benutzer-ID als Identität enthält
    # Zusätzlich speichern wir den Token-Wert als Claim, um ihn später identifizieren zu können
    refresh_token = create_refresh_token(
        identity=user.id,
        additional_claims={"jti": refresh_token_value}  # JWT ID für Token-Identifikation
    )
    
    # Response mit Access-Token und Benutzerinformationen erstellen
    response = jsonify({
        "message": "Anmeldung erfolgreich",
        "user": user.to_dict(),  # Gibt saubere Benutzerinformationen ohne sensible Daten zurück
        "access_token": access_token  # Access-Token wird direkt zurückgegeben
    })
    
    # Refresh-Token als sicheres Cookie setzen (HttpOnly verhindert JavaScript-Zugriff)
    response.set_cookie(
        'refresh_token_cookie',  # Cookie-Name
        refresh_token,           # Cookie-Wert (JWT Token)
        httponly=True,           # Verhindert Zugriff durch JavaScript (XSS-Schutz)
        secure=current_app.config['JWT_COOKIE_SECURE'],  # True in Produktion (HTTPS-only)
        samesite=current_app.config.get('JWT_COOKIE_SAMESITE', 'Lax'),  # CSRF-Schutz
        max_age=int(current_app.config['JWT_REFRESH_TOKEN_EXPIRES'].total_seconds())  # Lebenszeit als Integer
    )
    
    return response

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)  # Diese Route erfordert einen gültigen Refresh-Token
def refresh():
    """
    Erneuert den Access-Token mit einem gültigen Refresh-Token.
    
    Diese Route nutzt den im Cookie gespeicherten Refresh-Token, um einen
    neuen Access-Token zu generieren. Der Benutzer muss sich nicht erneut
    mit Benutzername/Passwort anmelden.
    
    Der Decorator @jwt_required(refresh=True) stellt sicher, dass nur
    Anfragen mit einem gültigen Refresh-Token akzeptiert werden.
    
    Returns:
        JSON-Response mit neuem Access-Token oder Fehlermeldung
    """
    # Identität (Benutzer-ID) aus dem Refresh-Token extrahieren
    user_id = get_jwt_identity()
    
    # Optional: Benutzer aus der Datenbank abrufen
    # Dies ist nützlich, um zu überprüfen, ob der Benutzer noch aktiv ist
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "Benutzer nicht gefunden"}), 401
    
    # Neuen Access-Token mit derselben Identität erstellen
    new_access_token = create_access_token(identity=user_id)
    
    # Erfolgsantwort mit dem neuen Access-Token zurückgeben
    return jsonify({
        "message": "Token erfolgreich erneuert",
        "access_token": new_access_token
    })

@auth_bp.route('/logout', methods=['POST'])
@jwt_required(refresh=True)  # Diese Route erfordert einen gültigen Refresh-Token
def logout():
    """
    Meldet einen Benutzer ab und widerruft seinen Refresh-Token.
    
    Diese Route führt zwei wichtige Aktionen durch:
    1. Sie markiert den Refresh-Token in der Datenbank als widerrufen,
    sodass er nicht mehr für Token-Erneuerungen verwendet werden kann
    2. Sie löscht das Refresh-Token-Cookie auf dem Client-Gerät
    
    Dies bietet einen sicheren Logout-Mechanismus und verhindert die
    weitere Nutzung des Tokens.
    
    Returns:
        JSON-Response mit Bestätigung der Abmeldung
    """
    # Token-Identifikator aus dem JWT extrahieren
    jti = get_jwt()["jti"]
    
    # Token in der Datenbank als widerrufen markieren, falls vorhanden
    token = RefreshToken.query.filter_by(token=jti).first()
    if token:
        token.revoked = True
        db.session.commit()
    
    # Response erstellen und Cookie löschen
    response = jsonify({"message": "Abmeldung erfolgreich"})
    response.delete_cookie('refresh_token_cookie')
    
    return response