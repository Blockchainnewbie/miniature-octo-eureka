USE carmonitoring;

CREATE TABLE refresh_tokens (
  token_id    CHAR(36)      PRIMARY KEY,            -- UUID oder ähnliches
  user_id     INT           NOT NULL,
  token       VARCHAR(255)  NOT NULL,               -- z.B. der Refresh-Token-String
  issued_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME      NOT NULL,
  revoked     TINYINT(1)    NOT NULL DEFAULT 0,     -- 0 = aktiv, 1 = zurückgezogen
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
