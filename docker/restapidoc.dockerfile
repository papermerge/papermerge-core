FROM python:3.8-buster as build

### STEP 1

RUN apt-get update;
RUN apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    poppler-utils \
    gcc

RUN mkdir /app
RUN mkdir /app/config/
RUN mkdir /app/papermerge/
WORKDIR /app

COPY ../poetry.lock /app/
COPY ../pyproject.toml /app/
COPY docker/config/ /app/config/
COPY docker/manage.py /app/
COPY papermerge/ /app/papermerge/

RUN pip install poetry
RUN poetry install
RUN poetry run python ./manage.py generateschema \
    --file openapi-schema.json \
    --format openapi-json

### STEP 2

FROM nginx:1.21.1-alpine

COPY --from=build /app/openapi-schema.json /usr/share/nginx/html
COPY docker/html/ /usr/share/nginx/html
