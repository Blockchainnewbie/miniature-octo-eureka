from datetime import datetime, timezone
from app.extensions import db
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.ext.hybrid import hybrid_property
import enum

# Erstellt eine neue Instanz der Klasse PasswortHasher aus Argon2
# Diese Instanz wird verwendet, um Passwörter zu hashen und zu überprüfen.
ph = PasswordHasher()

# Enum für die Benutzerrolle, passend zur Datenbank
class UserRole(enum.Enum):
    admin = "admin"
    user = "user"

class User(db.Model):
    """
    User-Modell für die Tabelle 'users'.
    Enthält die Attribute user_id, username, password_hash, role und created_at.
    Das Modell bildet die Datenbankstruktur ab und stellt Methoden für Passwort-Handling und Serialisierung bereit.
    """
    __tablename__ = 'users'
    id = db.Column('user_id', db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    _password = db.Column('password_hash', db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.user)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    refresh_tokens = db.relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    """
    Definiert eine One-to-Many-Beziehung zwischen User und RefreshToken.
    Ein Benutzer kann mehrere Refresh-Tokens besitzen (z.B. für verschiedene Geräte oder Sitzungen).
    "RefreshToken" gibt das Zielmodell an. "back_populates='user'" sorgt für eine bidirektionale Beziehung,
    sodass im RefreshToken-Modell ein entsprechendes user-Attribut existiert.
    "cascade='all, delete-orphan'" bewirkt, dass alle Operationen (z.B. Löschen) auf die Tokens übertragen werden
    und verwaiste Tokens automatisch aus der Datenbank entfernt werden.
    """

    @hybrid_property
    def password(self):
        """
        Hybrid-Property, die das direkte Auslesen des Passwort-Attributs verhindert.
        Ein direkter Zugriff wie user.password löst einen AttributeError aus.
        Das ist ein Sicherheitsmechanismus, um zu verhindern, dass der gehashte Passwort-String
        versehentlich exponiert wird. Das Setzen des Passworts erfolgt über den Setter.
        """
        raise AttributeError('Passwort kann nicht gelesen werden')

    @password.setter
    def password(self, password):
        """
        Setter für das Passwort. Wird aufgerufen, wenn einem Benutzerobjekt ein neues Passwort zugewiesen wird (z.B. user.password = "meinGeheimesPasswort").
        Das Passwort wird nicht im Klartext gespeichert, sondern mit Argon2 direkt beim Setzen gehasht.
        Dadurch landet niemals ein Klartext-Passwort in der Datenbank oder im Speicher.
        Das Vorgehen entspricht Best Practices für Sicherheit und Clean Code: Passwörter werden nie direkt gespeichert, sondern immer nur als Hash.
        Das schützt die Nutzer, selbst wenn Unbefugte Zugriff auf die Datenbank erhalten sollten.
        """
        self._password = ph.hash(password)

    def verify_password(self, password):
        """
        Überprüft ein vom Benutzer eingegebenes Passwort.
        Vergleicht das eingegebene Passwort mit dem in der Datenbank gespeicherten, gehashten Passwort (self._password).
        Verwendet ph.verify, um das Passwort mit dem gespeicherten Hash abzugleichen. Gibt True zurück, wenn das Passwort korrekt ist.
        Gibt False zurück, wenn das Passwort nicht stimmt (VerifyMismatchError). Andere Fehler werden nicht verschluckt.
        """
        try:
            ph.verify(self._password, password)
            return True
        except VerifyMismatchError:
            return False

    def to_dict(self):
        """
        Erstellt eine Dictionary-Repräsentation eines Benutzerobjekts.
        Diese Methode ist besonders nützlich, wenn Benutzerdaten über eine API als JSON ausgegeben werden sollen.
        Im Dictionary werden nur ausgewählte und unkritische Felder aufgenommen: die Benutzer-ID (user_id),
        der Benutzername (username), die Rolle des Benutzers (role) und das Erstellungsdatum (created_at).
        Das Rollenfeld wird dabei als Wert (self.role.value) ausgegeben, was darauf hindeutet, dass role ein Enum ist.
        Das Erstellungsdatum wird, falls vorhanden, in das ISO-Format umgewandelt, damit es standardisiert und leicht
        weiterverarbeitet werden kann.
        Sensible Informationen wie das Passwort werden hier bewusst nicht ausgegeben. Das macht die Methode sicher für
        die Verwendung in APIs und entspricht den Prinzipien von Clean Code und Datenschutz.
        """
        return {
            'user_id': self.id,
            'username': self.username,
            'role': self.role.value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        """
        Gibt eine lesbare String-Repräsentation des Benutzers für Debugging-Zwecke zurück.
        """
        return f'<User {self.username} (ID: {self.id}, Role: {self.role.name})>'



