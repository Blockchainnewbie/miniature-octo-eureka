USE carmonitoring;

INSERT INTO users (username, password_hash, role)
VALUES
  (
    'sonny', 
    '$argon2id$v=19$m=65536,t=3,p=4$Ep9FY7+xRSVx5LutXyforw$8wE2V3Wh0w3J4qVPfwSzh5crgYYY1PHGqvmcWbKkn/0',  -- hier den von Python erzeugten Hash einfügen
    'admin'
  );
