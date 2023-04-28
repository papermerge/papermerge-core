FROM papermerge/tivoli:0.2.0 as token_validator
FROM papermerge/auth-server:0.1.0 as auth_server
FROM python:3.10

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor

RUN pip install --upgrade poetry

COPY docker/dev/run.bash /run.bash
COPY docker/dev/supervisord.conf /etc/
COPY docker/dev/nginx.conf /etc/nginx/nginx.conf

RUN chmod +x /run.bash

COPY --from=token_validator /tivoli_app/ /tivoli_app
COPY --from=auth_server /auth_server_app/ /auth_server_app
COPY --from=auth_server /usr/share/nginx/html /usr/share/nginx/html/auth_server

EXPOSE 80

ENTRYPOINT ["/run.bash"]
CMD ["server"]
