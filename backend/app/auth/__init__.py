"""
Blueprint für Authentifizierungsfunktionen.

Stellt Endpunkte für Registrierung, Login, Token-Refresh und Logout bereit.
"""
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

# Importiere die Routen am Ende, um zirkuläre Importe zu vermeiden
from . import routes