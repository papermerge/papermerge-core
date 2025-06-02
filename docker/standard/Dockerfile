FROM node:20.13 as  frontend_build

WORKDIR build_frontend_app
COPY frontend/ .
RUN yarn install
RUN yarn workspace @papermerge/hooks build
RUN yarn workspace @papermerge/ui build


FROM papermerge/auth-server:1.1.3 as auth_server
FROM python:3.13-alpine as papermerge_core

ENV CORE_APP=/core_app
ENV PAPERMERGE__DATABASE__URL=sqlite:////db/db.sqlite3
ENV PAPERMERGE__AUTH__USERNAME=admin
ENV PAPERMERGE__AUTH__EMAIL=admin@example.com
ENV PAPERMERGE__MAIN__API_PREFIX=""
ENV PAPERMERGE__OCR__LANG_CODES="deu,eng,ron"
ENV PAPERMERGE__OCR__DEFAULT_LANG_CODE="deu"
ENV PAPERMERGE__OCR__AUTOMATIC="false"

RUN apk update && apk add linux-headers python3-dev \
    gcc \
    curl \
    libc-dev \
    supervisor \
    imagemagick \
    nginx \
    libpq-dev \
    poppler-utils

RUN pip install --upgrade poetry==2.0.1 roco==0.4.2
RUN curl -L -o /bin/env2js https://github.com/papermerge/env2js/releases/download/0.2/env2js.amd64
RUN chmod +x /bin/env2js

COPY poetry.lock pyproject.toml README.md LICENSE ${CORE_APP}/

WORKDIR ${CORE_APP}
RUN poetry install --no-root -E pg -vvv

COPY docker/standard/entrypoint.sh /entrypoint.sh
COPY docker/standard/bundles/supervisor/* /etc/papermerge/
COPY docker/standard/bundles/nginx/* /etc/nginx/
COPY docker/standard/logging.yaml /etc/papermerge/
COPY docker/standard/core.js.tmpl /${CORE_APP}/core.js.tmpl
COPY ./papermerge ${CORE_APP}/papermerge/
COPY alembic.ini ${CORE_APP}/


COPY ./docker/standard/scripts/ /usr/bin/
RUN chmod +x /usr/bin/*.sh
RUN chmod +x /entrypoint.sh

COPY --from=auth_server /app/ /auth_server_app/
COPY --from=auth_server /usr/share/nginx/html /usr/share/nginx/html/auth_server
COPY --from=frontend_build /build_frontend_app/apps/ui/dist/ /usr/share/nginx/html/ui

RUN cd /auth_server_app/ && poetry install -E pg
RUN cd /core_app/ && poetry install -E pg -E cloud

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]
