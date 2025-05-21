# filepath: backend/app/api.py
from flask import Blueprint

bp = Blueprint('api', __name__)

@bp.route('/ping')
def ping():
    """Test-Route für das API-Blueprint."""
    return {"message": "pong"}