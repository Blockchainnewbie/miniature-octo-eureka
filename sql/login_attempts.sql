CREATE TABLE login_attempts (
  attempt_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT        NULL,                      -- NULL, falls Username nicht existiert
  success     TINYINT(1) NOT NULL,                  -- 0 = gescheitert, 1 = erfolgreich
  ip_address  VARCHAR(45) NOT NULL,                 -- IPv4/IPv6
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
