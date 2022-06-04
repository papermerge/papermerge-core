# Papermerge with Docker

In this folder you will find docker related files for a quick setup of
Papermerge DMS and related services using [docker-compose](https://docs.docker.com/compose/).

Following docker compose files are available:

- prod-docker-compose.yml
- prod-backend-only.yml
- dev-docker-compose.yml
- services

Each of above mentioned files must be paired with an ``.env`` file where
environment variables are defined.


## Environment File

In order to use papermerge with docker compose you need to prepare an [environment
file](https://docs.docker.com/compose/env-file/) as it is not provided
in sources repository.


## prod-docker-compose.yml

Start all Papermerge DMS in production mode:

    docker-compose  -f docker/prod-docker-compose.yml --env-file <path to .env file> up

Above command will start following services:

- backend (REST API backend)
- ws_server (websockets server - used for real time notifications)
- worker (performs OCR)
- frontend (modern web UI)
- redis
- db (postgres)
- es (elasticsearch)
- traefik (ingress or entry point)

Add to your ``/etc/hosts`` desired hostname for your instance (e.g papermerge.local):

    127.0.0.1       papermerge.local

You can access Papermerge user interface using a web browser like Firefox.
Open your web browser and point it to http://papermerge.local address.

``.env`` file example:

    APP_IMAGE=papermerge/papermerge
    APP_TAG=latest
    PAPERMERGE_JS_IMAGE=papermerge/papermerge.js
    PAPERMERGE_JS_TAG=latest

    USE_HOSTNAME=papermerge.local

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=postgres
    DB_HOST=db
    DB_PORT=5432

    REDIS_HOST=redis
    REDIS_PORT=6379

    ES_HOSTS=es
    ES_PORT=9200

    SECRET_KEY=alsdkalsdjlaksdj90823423!KLKJLkjkjlkjlKLPOgrwqna

    SUPERUSER_USERNAME=admin
    SUPERUSER_EMAIL=admin@mail.com
    SUPERUSER_PASSWORD=password


instance from ``/etc/hosts``.


## prod-backend-only.yml

Start only Papermerge DMS REST API backend in production mode:

    docker-compose  -f docker/prod-backend-only.yml --env-file <path to .env file> up

Above command will start following services:

- backend (REST API backend)
- redis
- db (postgres)
- es (elasticsearch)

REST API backend base url is ``http://localhost:8000/api/``.

``.env`` file example:

    APP_IMAGE=papermerge/papermerge
    APP_TAG=latest

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=postgres
    DB_HOST=db
    DB_PORT=5432

    REDIS_HOST=redis
    REDIS_PORT=6379

    ES_HOSTS=es
    ES_PORT=9200

    SECRET_KEY=alsdkalsdjlaksdj90823423!KLKJLkjkjlkjlKLPOgrwqna

    SUPERUSER_USERNAME=admin
    SUPERUSER_EMAIL=admin@mail.com
    SUPERUSER_PASSWORD=password

## dev-docker-compose.yml

Start Papermerge DMS in development mode (without user interface):

    docker-compose  -f docker/dev-docker-compose.yml --env-file <path to .env file> up

Above command will start following services:

- backend (REST API backend)
- worker
- redis
- db (postgres)
- es (elasticsearch)

REST API backend base url is ``http://localhost:8000/api/``.

``.env`` file example:

    APP_IMAGE=papermerge/papermerge
    APP_TAG=latest

    PAPERMERGE_SRC_DIR=/home/eugen/GitHub/PapermergeCore/papermerge/

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=postgres
    DB_HOST=db
    DB_PORT=5432

    REDIS_HOST=redis
    REDIS_PORT=6379

    ES_HOSTS=es
    ES_PORT=9200

    SECRET_KEY=alsdkalsdjlaksdj90823423!KLKJLkjkjlkjlKLPOgrwqna

    SUPERUSER_USERNAME=admin
    SUPERUSER_EMAIL=admin@mail.com
    SUPERUSER_PASSWORD=password

Replace ``PAPERMERGE_SRC_DIR`` with path to papermerge source code on your
local computer. Note that ``PAPERMERGE_SRC_DIR`` will point the folder where
``core``, ``search``, ``notifications`` directories are.

## services.yml

For convenience, there is a docker-compose's ``services.yml`` file which can
be used to quickly start external services only: postgres, redis, elastic
search.

Services will start docker services in same network as host:

    docker-compose -f docker/services.yml --env-file <path to .env file> up

Example of ``.env`` file:

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=postgres


## App Docker Image

Build app docker image for production mode:

    docker build -t ghcr.io/papermerge/papermerge:latest -f docker/Dockerfile .

Build app docker image for development mode:

    docker build -t ghcr.io/papermerge/papermerge:latest -f docker/Dockerfile .


## Frontend Docker Image

Frontend or PapermergeJS is official web based user interface for Papermerge.
Frontend component is totally optional, because you can use Papermerge
with any REST API client; in this regard, Papermerge.JS is nothing more than
a REST API client (though, very user friendly one).

Note that both App and PapermergeJS docker images **should use same docker tag**
i.e. app docker image ``ghcr.io/papermerge/papermerge:2.1.0-alpha-2`` (where tag is
2.1.0-alpha-2) is compatible with ``ghcr.io/papermerge/papermerge.js:2.1.0-alpha-2``
frontend docker image. The compatibility is established based on ``2.1.0-alpha-2``
tag.

Following app and frontend docker images:

- ghcr.io/papermerge/papermerge:2.1.0-alpha-2
- ghcr.io/papermerge/papermerge.js:2.1.0-alpha-2

are combatible as well (because they use same ``2.1.0-alpha-2`` docker tag).

Instructions how to build frontend docker image are provided in [Papermerge.JS](https://github.com/papermerge/papermerge.js) repository.
