-- DB-Initialisierung für den Entwicklungscontainer
-- Dieses Script wird beim ersten Start des MySQL-Containers ausgeführt

-- Erstelle API-Benutzer für Anwendungszugriff
-- Verwende das gleiche Passwort wie für root für Einfachheit
CREATE USER IF NOT EXISTS 'apiuser'@'%' IDENTIFIED BY 'carmonitoring123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON carmonitoring.* TO 'apiuser'@'%';
FLUSH PRIVILEGES;

-- Verwende die carmonitoring Datenbank
USE carmonitoring;

-- Tabellen erstellen
CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)       NOT NULL UNIQUE,
  password_hash  VARCHAR(255)      NOT NULL,
  role           ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  token_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT               NOT NULL,
  token          VARCHAR(255)      NOT NULL,
  expires_at     DATETIME          NOT NULL,
  created_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  token_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT               NOT NULL,
  token          VARCHAR(255)      NOT NULL,
  expires_at     DATETIME          NOT NULL,
  created_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  attempt_id     INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)       NOT NULL,
  ip_address     VARCHAR(45)       NOT NULL,
  success        BOOLEAN           NOT NULL DEFAULT 0,
  attempt_time   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Test-Benutzer hinzufügen
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$argon2id$v=19$m=65536,t=3,p=4$c9TCkV2dTLrt/2uAb5v3wQ$2kb9AWgFajPV9MCcpEk1/nwZqEoRwKpVECP+6VsRI28', 'admin'),
('user', '$argon2id$v=19$m=65536,t=3,p=4$c9TCkV2dTLrt/2uAb5v3wQ$2kb9AWgFajPV9MCcpEk1/nwZqEoRwKpVECP+6VsRI28', 'user');
-- Passwort ist "password" für beide Benutzer
