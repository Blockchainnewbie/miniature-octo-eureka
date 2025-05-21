# tests/test_auth.py
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User

from app.extensions import db  # Stelle sicher, dass du die richtige db-Instanz importierst

@pytest.fixture
def app():
    """Erstellt und konfiguriert eine Flask-App für Tests"""
    # Explizit die Testkonfiguration mit In-Memory SQLite verwenden
    test_app = create_app('testing')
    print(f"DEBUGGING: Test-App erstellt mit ID {id(test_app)}")
    
    # App-Kontext hinzufügen
    with test_app.app_context():
        # Stelle sicher, dass die Datenbank existiert
        db.create_all()
        print(f"DEBUGGING: DB-Engine: {db.engine.url}")
        print("DEBUGGING: Datenbank-Tabellen erstellt")
        yield test_app
        # Aufräumen
        db.session.remove()
        db.drop_all()
        print("DEBUGGING: Datenbank aufgeräumt")

@pytest.fixture
def client(app):
    """Erstellt einen Test-Client für die gegebene App"""
    # Client im App-Kontext erstellen
    # Konfiguriere den Client so, dass er Cookies verfolgt
    with app.test_client(use_cookies=True) as client:
        # App-Kontext ist bereits vom app-Fixture aktiviert
        # Testbenutzer anlegen
        from app.models.user import User
        user = User(username='testuser')
        user.password = 'testpassword'
        db.session.add(user)
        db.session.commit()
        print(f"DEBUGGING: Testbenutzer 'testuser' erstellt")
        
        # Gib den Client zurück
        yield client
        
        # Aufräumen erfolgt bereits im app-Fixture

def test_app_exists(app):
    """Test, ob die App erstellt wird"""
    assert app is not None

def test_login_success(client):
    """Test erfolgreicher Login"""
    response = client.post('/api/auth/login', 
                        json={'username': 'testuser', 'password': 'testpassword'})
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert response.headers.get('Set-Cookie') is not None  # Prüft, ob Refresh-Token-Cookie gesetzt ist

def test_login_invalid_credentials(client):
    """Test fehlgeschlagener Login"""
    response = client.post('/api/auth/login', 
                        json={'username': 'testuser', 'password': 'falschespasswort'})
    assert response.status_code == 401

def test_protected_route_with_token(client):
    """Test Zugriff auf geschützte Route mit gültigem Token"""
    # Erst einloggen, um einen Token zu bekommen
    login_response = client.post('/api/auth/login', 
                              json={'username': 'testuser', 'password': 'testpassword'})
    assert login_response.status_code == 200  # Prüfe, ob Login erfolgreich war
    access_token = login_response.json['access_token']
    
    # Anfrage an geschützte Route mit Token
    # Flask-JWT-Extended erwartet das Format 'Bearer <token>'
    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get('/api/auth/protected', headers=headers)
    
    # Debug-Ausgabe für Fehlersuche
    print(f"DEBUGGING: Protected Route Response: {response.status_code} - {response.data.decode('utf-8')}")
    
    assert response.status_code == 200
    assert 'message' in response.json
    assert 'user' in response.json

def test_protected_route_without_token(client):
    """Test Zugriff auf geschützte Route ohne Token"""
    response = client.get('/api/auth/protected')
    assert response.status_code == 401  # Unauthorized

def test_refresh_token(client):
    """Test Token-Erneuerung mit Refresh-Token"""
    # Erst einloggen, um ein Refresh-Token-Cookie zu erhalten
    login_response = client.post('/api/auth/login', 
                              json={'username': 'testuser', 'password': 'testpassword'})
    assert login_response.status_code == 200  # Prüfe, ob Login erfolgreich war
    
    # Debug-Ausgabe für Cookies
    print(f"DEBUGGING: Login Cookie: {login_response.headers.get('Set-Cookie')}")
    
    # Versuche, einen neuen Access-Token mit dem Refresh-Token zu bekommen
    refresh_response = client.post('/api/auth/refresh')
    print(f"DEBUGGING: Refresh Response: {refresh_response.status_code} - {refresh_response.data.decode('utf-8')}")
    
    # Für erfolgreichen JWT-Cookie-Test muss der Client die Cookies korrekt handhaben
    assert refresh_response.status_code == 200
    assert 'access_token' in refresh_response.json

def test_logout(client):
    """Test Logout-Funktion"""
    # Erst einloggen, um ein Refresh-Token-Cookie zu erhalten
    login_response = client.post('/api/auth/login', 
                              json={'username': 'testuser', 'password': 'testpassword'})
    assert login_response.status_code == 200  # Prüfe, ob Login erfolgreich war
    
    # Logout durchführen
    logout_response = client.post('/api/auth/logout')
    print(f"DEBUGGING: Logout Response: {logout_response.status_code} - {logout_response.data.decode('utf-8')}")
    
    assert logout_response.status_code == 200
    assert 'message' in logout_response.json
    
    # Cookie sollte gelöscht worden sein (Value leer)
    cookie_header = logout_response.headers.get('Set-Cookie')
    assert 'refresh_token_cookie=' in cookie_header
    assert 'Max-Age=0' in cookie_header or 'Expires=Thu, 01 Jan 1970' in cookie_header

# Weitere Tests können hier hinzugefügt werden