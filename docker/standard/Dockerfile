FROM node:24-alpine AS frontend_build
# ensure all packages are up-to-date
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

WORKDIR /build_frontend_app
COPY frontend/ .

# Use corepack to manage Yarn version and install dependencies
RUN corepack enable && \
    yarn set version 4.9.2 && \
    yarn install --immutable && \
    yarn workspace ui build

FROM papermerge/auth-server:1.2 AS auth_server
#FROM auth:1.2 AS auth_server
FROM python:3.14-alpine AS papermerge_core

ENV CORE_APP=/core_app

# Install dependencies and ensure all packages are up-to-date
RUN apk update && apk add --no-cache linux-headers python3-dev \
    gcc \
    curl \
    libc-dev \
    supervisor \
    imagemagick \
    nginx \
    libpq-dev \
    poppler-utils && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

RUN pip install --upgrade uv && \
    curl -L -o /bin/env2js https://github.com/papermerge/env2js/releases/download/0.4/env2js.amd64 && \
    chmod +x /bin/env2js

COPY uv.lock pyproject.toml README.md LICENSE ${CORE_APP}/
COPY ./papermerge ${CORE_APP}/papermerge/

WORKDIR ${CORE_APP}
RUN uv sync --no-dev --extra cloud_storage

COPY docker/standard/entrypoint.sh /entrypoint.sh
COPY docker/standard/supervisord.conf docker/standard/log_config.yaml /core_app/
COPY docker/standard/nginx.conf /etc/nginx/
COPY docker/standard/core.js.tmpl alembic.ini ${CORE_APP}/

COPY docker/standard/scripts/ /usr/bin/
# Set execute permissions
RUN chmod +x /usr/bin/*.sh && \
    chmod +x /entrypoint.sh

# Copy auth server artifacts
COPY --from=auth_server /app/ /auth_server_app/
COPY --from=auth_server /usr/share/nginx/html/ /usr/share/nginx/html/auth_server/

# Copy frontend build artifacts
COPY --from=frontend_build /build_frontend_app/apps/ui/dist/ /usr/share/nginx/html/ui

# Install dependencies for auth server
RUN cd /auth_server_app/ && uv sync

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]
