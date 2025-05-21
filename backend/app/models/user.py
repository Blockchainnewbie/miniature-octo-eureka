# Benutzermodell für SQLAlchemy ORM
from datetime import datetime
from datetime import timezone
from flask_sqlalchemy import SQLAlchemy
from argon2 import PasswordHasher
from sqlalchemy.ext.hybrid import hybrid_property

db = SQLAlchemy()
ph = PasswordHasher()

# Benutzermodell für SQLAlchemy ORM

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password = db.Column('password', db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)

# Beziehungen
    # Die folgende Zeile definiert eine One-to-Many-Beziehung zwischen User und RefreshToken.
    # Ein Benutzer kann mehrere Refresh-Tokens besitzen (z.B. für verschiedene Geräte oder Sitzungen).
    # "RefreshToken" gibt das Zielmodell an. "back_populates='user'" sorgt für eine bidirektionale Beziehung,
    # sodass im RefreshToken-Modell ein entsprechendes user-Attribut existiert.
    # "cascade='all, delete-orphan'" bewirkt, dass alle Operationen (z.B. Löschen) auf die Tokens übertragen werden
    # und verwaiste Tokens automatisch aus der Datenbank entfernt werden.
    refresh_tokens = db.relationship("RefreshToken", back_populates="user", 
                                    cascade="all, delete-orphan")


    @hybrid_property
    def password(self):
        # Diese hybrid property verhindert das direkte Auslesen des Passwort-Attributs eines Benutzers.
        # Wenn versucht wird, auf user.password zuzugreifen, wird absichtlich eine AttributeError-Exception ausgelöst.
        # Das ist ein wichtiger Sicherheitsmechanismus: Passwörter sollen niemals im Klartext ausgelesen oder angezeigt werden können,
        # weder im Code noch versehentlich in Logs oder Debugging-Tools.
        # Die Verwendung von @hybrid_property erlaubt es, diese Eigenschaft sowohl auf Instanzebene als auch in Abfragen mit SQLAlchemy zu nutzen.
        # In diesem Fall wird aber nur das Auslesen blockiert. Das Setzen des Passworts erfolgt über den Setter,
        # der das Passwort hasht und sicher speichert.
        # Dieses Muster entspricht den Clean-Code- und Sicherheitsprinzipien, indem es verhindert,
        # dass sensible Daten versehentlich offengelegt werden.
        raise AttributeError('Passwort kann nicht gelesen werden')
        
    @password.setter
    def password(self, password):
        # Dieser Setter wird aufgerufen, wenn einem Benutzerobjekt ein neues Passwort zugewiesen wird (z.B. user.password = "meinGeheimesPasswort").
        # Das Passwort wird nicht im Klartext gespeichert, sondern mit Argon2 direkt beim Setzen gehasht.
        # Dadurch landet niemals ein Klartext-Passwort in der Datenbank oder im Speicher.
        # Das Vorgehen entspricht Best Practices für Sicherheit und Clean Code: Passwörter werden nie direkt gespeichert, sondern immer nur als Hash.
        # Das schützt die Nutzer, selbst wenn Unbefugte Zugriff auf die Datenbank erhalten sollten.
        self._password = ph.hash(password)
        
    def verify_password(self, password):
        # Diese Methode überprüft ein vom Benutzer eingegebenes Passwort.
        # Sie nimmt das eingegebene Passwort als Argument entgegen und vergleicht es
        # mit dem in der Datenbank gespeicherten, gehashten Passwort (self._password).
        #
        # Dazu wird die Funktion ph.verify verwendet, die das Passwort mit dem gespeicherten
        # Hash abgleicht. Ist die Überprüfung erfolgreich, gibt die Methode True zurück.
        # Falls ein Fehler auftritt (z.B. weil das Passwort nicht stimmt oder der Hash ungültig ist),
        # wird eine Exception abgefangen und die Methode gibt False zurück.
        #
        try:
            ph.verify(self._password, password)
            return True
        except Exception:
            return False



