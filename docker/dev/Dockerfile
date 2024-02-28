
ARG VERSION
FROM papermerge/papermerge:${VERSION}-ui as papermerge_ui

FROM papermerge/tivoli:0.4.4 as token_validator
FROM papermerge/auth-server:0.7.0 as auth_server
FROM python:3.10 as papermerge_core

ENV CORE_APP=/core_app
ENV PAPERMERGE__DATABASE__URL=sqlite:////db/db.sqlite3
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PAPERMERGE__AUTH__USERNAME=admin
ENV PAPERMERGE__AUTH__EMAIL=admin@example.com
ENV PAPERMERGE__OCR__DEFAULT_LANGUAGE=deu

ENV VIRTUAL_ENV=${CORE_APP}/.venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    tesseract-ocr-fra \
    tesseract-ocr-spa \
    tesseract-ocr-por \
    tesseract-ocr-ron \
    tesseract-ocr-ita \
    imagemagick \
    gcc \
    nginx \
    supervisor \
    poppler-utils \
    ghostscript \
    nodejs \
    npm

RUN pip install --upgrade poetry roco==0.3.0

RUN python -m venv ${VIRTUAL_ENV}

COPY poetry.lock pyproject.toml README.md LICENSE ${CORE_APP}/

WORKDIR ${CORE_APP}
RUN poetry install --no-root -vvv

COPY docker/dev/run.bash /run.bash
COPY docker/dev/supervisord.conf /etc/
COPY docker/dev/nginx.conf /etc/nginx/nginx.conf
COPY docker/dev/logging.yml ${CORE_APP}/logging.yml
COPY ./papermerge ${CORE_APP}/papermerge/
COPY ./docker/dev/config ${CORE_APP}/config
COPY ./docker/dev/manage.py ${CORE_APP}/manage.py

RUN chmod +x /run.bash

COPY --from=token_validator /tivoli_app/ /tivoli_app
COPY --from=auth_server /auth_server_app/ /auth_server_app
COPY --from=auth_server /usr/share/nginx/html /usr/share/nginx/html/auth_server
COPY --from=papermerge_ui /core_ui /core_ui/

COPY ./docker/dev/scripts/ /usr/bin/
RUN chmod +x /usr/bin/*.sh

RUN cd /core_ui/ && npm i

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]
