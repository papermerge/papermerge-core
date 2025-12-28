# Papermerge with OIDC Authentication (Keycloak)

This directory contains Docker configuration for running Papermerge with external OIDC
authentication using Keycloak as the identity provider.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Browser                                                        │
│     │                                                           │
│     ▼                                                           │
│  ┌──────────────────┐                                           │
│  │  OAuth2-Proxy    │◄────────────┐                             │
│  │  (Port 8080)     │             │ OIDC Auth                   │
│  └────────┬─────────┘             │                             │
│           │                       │                             │
│           │ Remote-User           │                             │
│           │ Remote-Email          │                             │
│           │ Remote-Groups         │                             │
│           ▼                       │                             │
│  ┌──────────────────┐    ┌───────┴────────┐                     │
│  │   Papermerge     │    │   Keycloak     │                     │
│  │   (Port 80)      │    │   (Port 9090)  │                     │
│  └────────┬─────────┘    └───────┬────────┘                     │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌───────────────────────────────────────────┐                  │
│  │           PostgreSQL 17 (Port 5432)       │                  │
│  │  ┌─────────────────┐ ┌─────────────────┐  │                  │
│  │  │  papermerge DB  │ │   keycloak DB   │  │                  │
│  │  └─────────────────┘ └─────────────────┘  │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Generate Cookie Secret

From the project root run:

```bash
cd <project root>/docker/oidc/
export OAUTH2_COOKIE_SECRET=$(openssl rand -base64 32)
echo "OAUTH2_COOKIE_SECRET=$OAUTH2_COOKIE_SECRET" > .env
```

### 2. Start Services

```bash
cd <project root>/docker/oidc/
docker compose up -d
```

Some more fancy commands:

```bash
cd <project root>/docker/oidc/
docker compose up --build
```

With logs redirect:

```bash
cd <project root>/docker/oidc/
 docker compose up --build 2>&1 | tee compose.log
```

### 3. Wait for Initialization

Keycloak takes 1-2 minutes to initialize and import the realm.

```bash
# Check status
cd <project root>/docker/oidc/
docker compose ps

# View logs
cd <project root>/docker/oidc/
docker compose logs -f
```

### 4. Access

| Service        | URL                   | Credentials    |
|----------------|-----------------------|----------------|
| Papermerge     | http://localhost:8080 | (via Keycloak) |
| Keycloak Admin | http://localhost:9090 | admin / admin  |

### 5. Login

Pre-configured test users:

| Username | Password | Role  | Description        |
|----------|----------|-------|--------------------|
| admin    | admin    | admin | Full administrator |
| demo     | demo     | user  | Regular user       |

## How It Works

1. User accesses Papermerge at `http://localhost:8080`
2. OAuth2-Proxy checks for valid session
3. If no session, redirects to Keycloak login
4. After login, Keycloak redirects back to OAuth2-Proxy
5. OAuth2-Proxy creates session and forwards requests with headers:
    - `X-Forwarded-User`: Username
    - `X-Forwarded-Email`: Email
    - `X-Forwarded-Groups`: Groups (comma-separated)
6. Papermerge reads these headers via `RemoteUserScheme`
7. Users are auto-created on first login

## Configuration

### Environment Variables

| Variable               | Description                  | Required |
|------------------------|------------------------------|----------|
| `OAUTH2_COOKIE_SECRET` | Secret for session cookies   | Yes      |
| `PM_DB_URL`            | PostgreSQL connection string | Yes      |

### Keycloak Customization

1. Access Keycloak Admin at http://localhost:9090
2. Login with `admin` / `admin`
3. Select `papermerge` realm
4. Modify users, groups, roles as needed

To export realm for persistence:

```bash
docker compose exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export --realm papermerge
docker compose cp keycloak:/tmp/export/papermerge-realm.json \
  ./keycloak/realm-export.json
```

## Using with Other OIDC Providers

This Papermerge image works with any OIDC provider. Just replace Keycloak with your
provider.

### Authentik

```yaml
oauth2-proxy:
  command:
    - --provider=oidc
    - --oidc-issuer-url=https://authentik.example.com/application/o/papermerge/
    - --client-id=your-client-id
    - --client-secret=your-client-secret
    # ... other options
```

### Auth0

```yaml
oauth2-proxy:
  command:
    - --provider=oidc
    - --oidc-issuer-url=https://your-tenant.auth0.com/
    - --client-id=your-client-id
    - --client-secret=your-client-secret
```

## Building the Image

```bash
cd <project root>/docker/oidc/
docker compose build papermerge --no-cache
```
