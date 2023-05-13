FROM papermerge/tivoli:0.2.0 as token_validator
FROM papermerge/auth-server:0.2.0 as auth_server
FROM python:3.10 as papermerge_core

ENV CORE_APP=/core_app
ENV VIRTUAL_ENV=${CORE_APP}/.venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    gcc \
    nginx \
    supervisor \
    poppler-utils \
    ghostscript \
    nodejs \
    npm

RUN pip install --upgrade poetry

RUN python -m venv ${VIRTUAL_ENV}

COPY poetry.lock pyproject.toml ${CORE_APP}/

WORKDIR ${CORE_APP}
RUN poetry install --no-root -vvv

COPY docker/dev/run.bash /run.bash
COPY docker/dev/supervisord.conf /etc/
COPY docker/dev/nginx.conf /etc/nginx/nginx.conf
### COPY ./papermerge ${CORE_APP}/papermerge/
COPY ./docker/dev/config ${CORE_APP}/config
COPY ./docker/dev/manage.py ${CORE_APP}/manage.py
### COPY ui/ /core_ui/

RUN chmod +x /run.bash

COPY --from=token_validator /tivoli_app/ /tivoli_app
COPY --from=auth_server /auth_server_app/ /auth_server_app
COPY --from=auth_server /usr/share/nginx/html /usr/share/nginx/html/auth_server

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]