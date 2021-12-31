# Papermerge with Docker

In this folder you will find docker related files for a quick setup of
Papermerge DMS using [docker-compose](https://docs.docker.com/compose/).

There are at least two distinct modes way
to run Papermerge:

- production
- development

First mode is suitable for production deployments. Development mode is suitable only for developers
and is meant to quick setup all external services and all dependencies required
for development environment.

Basically if you are developer and intend to play with source code - development mode is for you,
otherwise use production mode.

Docker compose files for production mode start with prefix ``prod-``. For development mode start
with prefix ``dev-``.

## Environment File

In order to use papermerge with docker compose you need to prepare an [environment
file](https://docs.docker.com/compose/env-file/) as it is not provided
in sources repository.

Environment file example (file named ``.env``):

    APP_IMAGE=papermerge
    APP_TAG=2.1dev48
    PAPERMERGE_JS_IMAGE=frontend
    PAPERMERGE_JS_TAG=2.1dev3

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=your-database-password
    DB_HOST=db
    DB_PORT=5432

    REDIS_HOST=redis
    REDIS_PORT=6379

    SECRET_KEY=your-secret-key

    SUPERUSER_USERNAME=admin
    SUPERUSER_EMAIL=admin@mail.com
    SUPERUSER_PASSWORD=your-superuser-password

With ``.env`` prepared, start papermerge services (production mode) using following command:

    docker-compose  -f docker/prod-docker-compose.yml --env-file docker/app/prod/.env up

Run papermerge in development mode (with source code mounted):

    docker-compose  -f docker/dev-docker-compose.yml --env-file docker/app/dev/.env up

Follow logs of individual services:

    docker-compose -f docker/prod-docker-compose.yml --env-file docker/app/prod/.env logs backend

For development mode:

    docker-compose -f docker/dev-docker-compose.yml --env-file docker/app/dev/.env logs backend

Start papermerge's worker only using following command::

    docker-compose  -f docker/prod-docker-compose.yml --env-file docker/app/prod/.env up worker


## App


App docker image is the image of papermerge. The very same image can run in
(at least) two ways:

- as REST API backend
- as worker

There can be any number of workers you want, however there can be only one
REST API backend. Workers perform heavy background tasks like OCRing the
documents.

In production mode, papermerge image can start websocket server
(named ``ws_server`` in compose file). Websocker sever is used for sending
realtime notifications to the clients about server side events (e.g. OCR of
the document was successfully complete).

In order to build app docker image:

    docker bulid -t papermerge:2.1dev51 -f docker/app/dev/Dockerfile .


## Services

For convenience, there is a docker-compose's ``services.yml`` file which can
be used to quickly start external services only: postgres, redis, elastic
search.
