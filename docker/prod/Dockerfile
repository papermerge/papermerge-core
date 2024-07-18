FROM node:20.13 as  build

WORKDIR build_ui_app
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY ui2/package.json ui2/yarn.lock ui2/tsconfig.json ui2/vite.config.ts ui2/index.html .
COPY ui2/ .
RUN yarn install
RUN NODE_ENV=production yarn build


FROM papermerge/auth-server:0.9.0 as auth_server
FROM python:3.11 as papermerge_core

ENV CORE_APP=/core_app
ENV PAPERMERGE__DATABASE__URL=sqlite:////db/db.sqlite3
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PAPERMERGE__AUTH__USERNAME=admin
ENV PAPERMERGE__AUTH__EMAIL=admin@example.com
ENV PAPERMERGE__OCR__DEFAULT_LANGUAGE=deu
ENV PAPERMERGE__MAIN__API_PREFIX=""

ENV VIRTUAL_ENV=${CORE_APP}/.venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    tesseract-ocr-fra \
    tesseract-ocr-spa \
    tesseract-ocr-ita \
    tesseract-ocr-ron \
    tesseract-ocr-por \
    tesseract-ocr-nld \
    imagemagick \
    gcc \
    nginx \
    supervisor \
    poppler-utils \
    ghostscript \
    nodejs \
    npm

RUN pip install --upgrade poetry roco==0.4.2

RUN python -m venv ${VIRTUAL_ENV}

COPY poetry.lock pyproject.toml README.md LICENSE ${CORE_APP}/

WORKDIR ${CORE_APP}
RUN poetry install --no-root -vvv

COPY docker/prod/run.bash /run.bash
COPY docker/prod/bundles/supervisor/* /etc/papermerge/
COPY docker/prod/bundles/nginx/* /etc/nginx/
COPY docker/prod/logging.yaml /etc/papermerge/
COPY ./papermerge ${CORE_APP}/papermerge/
COPY ./docker/prod/config ${CORE_APP}/config
COPY ./docker/prod/manage.py ${CORE_APP}/manage.py

COPY ./docker/prod/scripts/ /usr/bin/
RUN chmod +x /usr/bin/*.sh
RUN chmod +x /run.bash

COPY --from=auth_server /auth_server_app/ /auth_server_app
COPY --from=auth_server /usr/share/nginx/html /usr/share/nginx/html/auth_server
COPY --from=build /build_ui_app/dist/ /usr/share/nginx/html/ui

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]
