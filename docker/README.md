# Papermerge with Docker

## Docker Compose

In order to use papermerge with docker compose you need to prepare an [environment
file](https://docs.docker.com/compose/env-file/).

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

With ``.env`` prepared, start papermerge services using following command:

    docker-compose  -f docker/docker-compose.yml --env-file .env up

Follow logs of individual services:

    docker-compose -f docker/docker-compose.yml --env-file .env logs backend

Start papermerge's worker only using following command::

    docker-compose  -f docker/docker-compose.yml --env-file .env up worker


## Docker Images


### App

App docker image is the image used for backend rest api, websockets servers and celery workers.

In order to build app docker image:

    docker bulid -t papermerge:2.1dev51 -f docker/app/prod/Dockerfile .


