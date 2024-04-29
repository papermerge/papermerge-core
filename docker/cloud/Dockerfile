FROM node:19 as  build

WORKDIR build_ui_app
COPY ui/package.json ui/package-lock.json ui/tsconfig.json .
COPY ui/ .
RUN npm install
RUN npm run build

FROM papermerge/oidc:0.1.0 as oidc_app
FROM python:3.11-slim-bookworm

ENV CORE_APP=/core_app \
    DJANGO_SETTINGS_MODULE=config.settings
ENV VIRTUAL_ENV=${CORE_APP}/venv

WORKDIR ${CORE_APP}

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    imagemagick \
    gcc \
    supervisor \
    poppler-utils \
    ghostscript

RUN pip install --upgrade poetry roco==0.4.2 && \
    python -m venv ${VIRTUAL_ENV}

COPY poetry.lock pyproject.toml README.md LICENSE ${CORE_APP}/
RUN poetry install --no-root --with pg -vv

COPY docker/cloud/etc/ /etc/papermerge/
COPY docker/cloud/run.bash /run.bash
COPY ./papermerge ${CORE_APP}/papermerge/
COPY ./docker/cloud/config ${CORE_APP}/config
COPY ./docker/cloud/manage.py ${CORE_APP}/manage.py

RUN chmod +x /usr/bin/*.sh
RUN chmod +x /run.bash

COPY --from=oidc_app /app/ /oidc_app
COPY --from=build /build_ui_app/build/ /usr/share/html/ui

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]
