# Diagramme und Strukturen

Dieses Dokument enthält Diagramme und Visualisierungen der Projekt-Architektur für das miniature-octo-eureka Projekt.

## Klassendiagramm

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string _password
        +UserRole role
        +DateTime created_at
        +List~RefreshToken~ refresh_tokens
        +password() : property
        +verify_password(string) : bool
        +to_dict() : dict
    }

    class RefreshToken {
        +string token_id
        +int user_id
        +string token
        +DateTime issued_at
        +DateTime expires_at
        +bool revoked
        +User user
        +is_expired() : bool
        +is_valid() : bool
        +revoke() : void
    }

    class JWTManager {
        +user_identity_lookup(user) : string
        +user_lookup_callback(jwt_header, jwt_data) : User
        +check_if_token_revoked(jwt_header, jwt_payload) : bool
    }

    class Flask {
        +config
        +register_blueprint(blueprint, url_prefix)
    }

    class SQLAlchemy {
        +Model
        +Column
        +relationship()
        +create_all()
        +drop_all()
    }

    class Config {
        +string SECRET_KEY
        +bool SQLALCHEMY_TRACK_MODIFICATIONS
        +string JWT_SECRET_KEY
        +timedelta JWT_ACCESS_TOKEN_EXPIRES
        +timedelta JWT_REFRESH_TOKEN_EXPIRES
        +list JWT_TOKEN_LOCATION
        +bool JWT_COOKIE_SECURE
    }

    class AuthBlueprint {
        +test_route()
        +protected()
        +create_user()
        +login()
        +refresh()
        +logout()
    }

    User "1" -- "many" RefreshToken : has
    RefreshToken --> User : belongs to
    JWTManager --> User : authenticates
    Config -- Flask : configures
    Flask -- AuthBlueprint : uses
    SQLAlchemy -- User : defines
    SQLAlchemy -- RefreshToken : defines
```

## Strukturdiagramm

```mermaid
graph TB
    subgraph "miniature-octo-eureka"
        A[README.md]
        B[docker-compose.yml]
        C[docker-compose.ci.yml]
        D[LICENSE]
        
        subgraph "backend"
            E[Dockerfile]
            F[requirements.txt]
            
            subgraph "app"
                G[__init__.py]
                H[api.py]
                I[config.py]
                J[extensions.py]
                
                subgraph "auth"
                    K[__init__.py]
                    L[routes.py]
                end
                
                subgraph "models"
                    M[__init__.py]
                    N[user.py]
                    O[refresh_token.py]
                end
            end
            
            subgraph "tests"
                P[__init__.py]
                Q[test_auth.py]
            end
            
            subgraph "utils"
                R[__init__.py]
                S[security.py]
            end
        end
        
        subgraph "frontend"
            T[Dockerfile]
            U[index.html]
            V[package.json]
            W[vite.config.js]
            
            subgraph "src"
                X[Components]
                Y[Assets]
            end
        end
        
        subgraph "docs"
            Z[documentation.md]
            AA[jwt_authentication.md]
            AB[test_documentation.md]
            AC[function_explained.md]
            AD[changes_log.md]
            AE[diagrams.md]
        end
    end
    
    G --> K
    G --> J
    K --> L
    J --> N
    J --> O
```

## Programmablaufplan: JWT Authentifizierung

```mermaid
flowchart TD
    A[Start] --> B{Benutzer angemeldet?}
    B -->|Nein| C[Login-Formular anzeigen]
    C --> D[Benutzer gibt Credentials ein]
    D --> E[POST /api/auth/login]
    E --> F{Credentials gültig?}
    F -->|Nein| G[Fehler: 401 Unauthorized]
    G --> C
    F -->|Ja| H[Access-Token erstellen]
    H --> I[Refresh-Token erstellen]
    I --> J[Refresh-Token in DB speichern]
    J --> K[Refresh-Token als Cookie setzen]
    K --> L[Access-Token und Benutzerdaten zurückgeben]
    L --> M[Frontend speichert Access-Token]
    
    B -->|Ja| N[Geschützte API-Anfrage mit Token]
    M --> N
    N --> O{Token gültig?}
    O -->|Nein| P{Refresh-Token vorhanden?}
    P -->|Ja| Q[POST /api/auth/refresh]
    Q --> R{Refresh-Token gültig?}
    R -->|Ja| S[Neuen Access-Token erstellen]
    S --> N
    R -->|Nein| C
    P -->|Nein| C
    O -->|Ja| T[API-Antwort zurückgeben]
    T --> U[Weiter mit App-Logik]
    
    V[Logout-Button geklickt] --> W[POST /api/auth/logout]
    W --> X[Refresh-Token in DB als widerrufen markieren]
    X --> Y[Refresh-Token-Cookie löschen]
    Y --> Z[Access-Token löschen]
    Z --> C
```

## Datenbankschema

```mermaid
erDiagram
    USERS {
        int user_id PK
        string username
        string password_hash
        enum role
        datetime created_at
    }
    
    REFRESH_TOKENS {
        string token_id PK
        int user_id FK
        string token
        datetime issued_at
        datetime expires_at
        boolean revoked
    }
    
    USERS ||--o{ REFRESH_TOKENS : "has"
```

---

*Diagramme erstellt am: 21.05.2025*
