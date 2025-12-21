# Papermerge Core - OIDC/Remote Auth Version
# This image contains only Papermerge backend + frontend without any built-in authentication.
# Authentication is expected to be provided by an external OIDC provider
FROM node:24 AS frontend_build

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /build_frontend_app
COPY frontend/ .

# Use corepack to manage Yarn version and install dependencies
RUN corepack enable && \
    yarn set version 4.9.2 && \
    yarn install --immutable && \
    yarn workspace ui build


FROM python:3.14-slim-bookworm AS papermerge_core

ENV CORE_APP=/core_app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    supervisor \
    imagemagick \
    nginx \
    libpq-dev \
    poppler-utils \
    libmagic1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv
# Install uv and env2js
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    mv /root/.local/bin/uv /usr/local/bin/uv && \
    mv /root/.local/bin/uvx /usr/local/bin/uvx && \
    curl -L -o /bin/env2js https://github.com/papermerge/env2js/releases/download/0.2/env2js.amd64 && \
    chmod +x /bin/env2js

# Install env2js for runtime config generation
RUN curl -L -o /bin/env2js https://github.com/papermerge/env2js/releases/download/0.2/env2js.amd64 && \
    chmod +x /bin/env2js

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock README.md LICENSE ${CORE_APP}/

WORKDIR ${CORE_APP}

# Install Python dependencies using uv
RUN uv sync --frozen --no-dev

# Copy application code
COPY alembic.ini ${CORE_APP}/
COPY ./papermerge ${CORE_APP}/papermerge/

RUN uv pip install -e . --no-deps

# Copy Docker configuration files
COPY docker/oidc/entrypoint.sh /entrypoint.sh
COPY docker/oidc/bundles/supervisor/supervisord.conf /etc/papermerge/supervisord.conf
COPY docker/oidc/bundles/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/oidc/logging.yaml /etc/papermerge/logging.yaml
COPY docker/oidc/core.js.tmpl ${CORE_APP}/

# Set execute permissions
RUN chmod +x /entrypoint.sh

# Copy frontend build artifacts
COPY --from=frontend_build /build_frontend_app/apps/ui/dist/ /usr/share/nginx/html/ui

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]
