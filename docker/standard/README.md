# Papermerge DMS

This directory contains Docker configuration for running Papermerge with its
own basic authentication.

## Quick Start

### Start Services

```bash
cd <project root>/docker/standard/
docker compose up -d
```

Some more fancy commands:

```bash
cd <project root>/docker/standard/
docker compose up --build
```

With logs redirect:

```bash
cd <project root>/docker/standard/
 docker compose up --build 2>&1 | tee compose.log
```

### Wait for Initialization

```bash
# Check status
cd <project root>/docker/standard/
docker compose ps

# View logs
cd <project root>/docker/standard/
docker compose logs -f
```

### Access

| Service    | URL                   | Credentials |
|------------|-----------------------|-------------|
| Papermerge | http://localhost:7000 | admin/admin |

### Login

Pre-configured test users:

| Username | Password | Role  | Description        |
|----------|----------|-------|--------------------|
| admin    | admin    | admin | Full administrator |

## Building the Image

```bash
cd <project root>/docker/standard/
docker compose build papermerge --no-cache
```
