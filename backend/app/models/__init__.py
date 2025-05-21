from datetime import datetime
from app.models.refresh_token import RefreshToken
from app.extensions import db

def cleanup_expired_tokens():
    """
    Löscht alle abgelaufenen oder widerrufenen Tokens aus der Datenbank.
    Diese Funktion kann regelmäßig über einen Scheduler aufgerufen werden.
    """
    try:
        # Lösche alle abgelaufenen oder widerrufenen Tokens
        RefreshToken.query.filter(
            (RefreshToken.expires_at < datetime.utcnow()) | 
            (RefreshToken.is_revoked == True)
        ).delete()
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Fehler beim Bereinigen der Tokens: {e}")
        return False