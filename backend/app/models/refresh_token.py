from datetime import datetime
from app.extensions import db
import uuid

class RefreshToken(db.Model):
    """
    Modell zur Verwaltung von JWT Refresh-Tokens.
    
    Refresh-Tokens ermöglichen es dem Client, ohne erneute Anmeldung 
    einen neuen Access-Token zu erhalten, wenn der alte abgelaufen ist.
    Sie haben typischerweise eine längere Lebensdauer als Access-Tokens.
    """
    __tablename__ = 'refresh_tokens'
    
    token_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    token = db.Column(db.String(255), nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    
    # Beziehung zum User-Modell (bidirektional)
    user = db.relationship("User", back_populates="refresh_tokens")
    
    def is_expired(self):
        """
        Überprüft, ob der Token abgelaufen ist.
        
        Returns:
            bool: True wenn abgelaufen, sonst False
        """
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self):
        """
        Überprüft, ob der Token gültig ist (nicht abgelaufen und nicht widerrufen).
        
        Returns:
            bool: True wenn gültig, sonst False
        """
        return not self.is_expired() and not self.revoked
    
    def revoke(self):
        """
        Widerruft den Token (z.B. bei Logout).
        """
        self.revoked = True
    
    def __repr__(self):
        """String-Repräsentation für Debugging."""
        return f'<RefreshToken {self.token_id[:8]}... (User: {self.user_id}, Valid: {self.is_valid()})>'