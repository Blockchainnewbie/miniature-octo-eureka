# Benutzermodell für SQLAlchemy ORM
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from argon2 import PasswordHasher
from sqlalchemy.ext.hybrid import hybrid_property

db = SQLAlchemy()
ph = PasswordHasher()