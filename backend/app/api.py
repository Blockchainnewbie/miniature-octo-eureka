# filepath: backend/app/api.py
from flask import Blueprint, jsonify

bp = Blueprint('api', __name__)

@bp.route('/ping')
def ping():
    """Test-Route für das API-Blueprint."""
    return {"message": "pong"}

@bp.route('/health')
def health():
    """Health-Check Route für CI/CD und Container Orchestrierung."""
    return jsonify({"status": "healthy"})