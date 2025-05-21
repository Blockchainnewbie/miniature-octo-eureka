CREATE TABLE password_reset_tokens (
  reset_id    CHAR(36)     PRIMARY KEY,             -- UUID
  user_id     INT          NOT NULL,
  token       VARCHAR(255) NOT NULL,               -- Einmal-Token
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,     -- 0 = neu, 1 = schon verbraucht
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
