FROM node:19 as  build

WORKDIR build_ui_app
COPY ui2/ .
RUN yarn install
RUN yarn build

FROM papermerge/oidc:0.2.3 as oidc_app
FROM caddy:2.7 AS caddy
FROM python:3.11-slim-bookworm

ENV CORE_APP=/core_app
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV VIRTUAL_ENV=${CORE_APP}/venv

WORKDIR ${CORE_APP}

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    imagemagick \
    gcc \
    supervisor \
    poppler-utils \
    ghostscript &&\
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade poetry roco==0.4.4 && \
    python -m venv ${VIRTUAL_ENV}

COPY poetry.lock pyproject.toml README.md LICENSE ${CORE_APP}/
COPY ./papermerge ${CORE_APP}/papermerge/
COPY ./docker/cloud/config ${CORE_APP}/config
COPY ./docker/cloud/manage.py ${CORE_APP}/manage.py

RUN poetry install -E pgsql -E cloud -vv

COPY docker/cloud/etc/ /etc/papermerge/
COPY docker/cloud/run.bash /run.bash
RUN chmod +x /run.bash

COPY --from=oidc_app /oidc_app/ /oidc_app
COPY --from=build /build_ui_app/dist/ /usr/share/html/ui
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]
