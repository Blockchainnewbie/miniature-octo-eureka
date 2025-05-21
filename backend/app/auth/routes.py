"""
Routen für die Benutzerauthentifizierung.

Dieses Modul enthält alle Endpunkte, die für die Benutzerauthentifizierung benötigt werden.
"""
from flask import jsonify
from . import auth_bp  # Importiere den Blueprint aus __init__.py

# Eine einfache Testroute zum Einstieg
@auth_bp.route('/test', methods=['GET'])
def test_route():
    """Einfache Testroute um zu prüfen, ob der Blueprint funktioniert."""
    return jsonify({"message": "Auth-Blueprint funktioniert!"})