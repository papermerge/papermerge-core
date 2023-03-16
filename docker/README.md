# Papermerge with Docker

In this folder you will find docker related files for a quick setup of
Papermerge DMS and related services using [docker-compose](https://docs.docker.com/compose/).

Following docker compose files are available:

- docker-compose.yml
- services

Each of above-mentioned files must be paired with an ``.env`` file where
environment variables are defined.


## Environment File

In order to use papermerge with docker compose you need to prepare an [environment
file](https://docs.docker.com/compose/env-file/) as it is not provided
in sources repository.

## docker-compose.yml

Start Papermerge DMS:

    docker-compose  -f docker/docker-compose.yml --env-file <path to .env file> up

You can access Papermerge user interface using a web browser like Firefox.
Open your web browser and point it to http://localhost:16000 address.

``.env`` file example:

    DB_USER=postgres
    DB_NAME=postgres
    DB_PASSWORD=postgres
    DB_HOST=db
    DB_PORT=5432

    SECRET_KEY=abcd

    SUPERUSER_USERNAME=admin
    SUPERUSER_EMAIL=admin@mail.com
    SUPERUSER_PASSWORD=password

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
