# Stage 1: Frontend build
FROM node:24-alpine AS frontend_build

WORKDIR /build

# Copy entire frontend directory (yarn workspaces require complete structure)
COPY frontend/ .

# Enable corepack and install dependencies
RUN corepack enable && \
    yarn set version 4.9.2 && \
    yarn install --immutable && \
    yarn workspace ui build


# Stage 2: Python dependencies build
FROM python:3.14-alpine AS python_build

# Install build dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev

WORKDIR /build

# Copy dependency files
COPY pyproject.toml uv.lock README.md LICENSE ./
COPY papermerge/ ./papermerge/

# Install uv, dependencies, and application to system Python
RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache -r <(uv export --frozen --no-dev) && \
    pip install --no-cache-dir . --no-deps


# Stage 3: Final runtime image
FROM python:3.14-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    supervisor \
    imagemagick \
    nginx \
    libpq \
    poppler-utils \
    libmagic

# Download env2js
RUN curl -L -o /bin/env2js https://github.com/papermerge/env2js/releases/download/0.4/env2js.amd64 && \
    chmod +x /bin/env2js

# Copy installed Python packages from build stage
COPY --from=python_build /usr/local/lib/python3.14/site-packages /usr/local/lib/python3.14/site-packages
COPY --from=python_build /usr/local/bin/pm /usr/local/bin/pm
COPY --from=python_build /usr/local/bin/alembic /usr/local/bin/alembic
COPY --from=python_build /usr/local/bin/uvicorn /usr/local/bin/uvicorn

WORKDIR /app

# Copy application config (papermerge module is already in site-packages)
COPY alembic.ini ./
COPY papermerge/core/alembic ./papermerge/core/alembic
COPY pyproject.toml README.md LICENSE ./

# Copy Docker configuration files
COPY docker/oidc/entrypoint.sh /entrypoint.sh
COPY docker/oidc/bundles/supervisor/supervisord.conf /app/supervisord.conf
COPY docker/oidc/bundles/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/oidc/logging.yaml /app/logging.yaml
COPY docker/oidc/core.js.tmpl ./

RUN chmod +x /entrypoint.sh

# Copy frontend build artifacts
COPY --from=frontend_build /build/apps/ui/dist/ /usr/share/nginx/html/ui

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]
