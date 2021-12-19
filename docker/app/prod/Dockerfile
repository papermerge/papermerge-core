FROM python:3.8 as build

### STEP 1 - pull all python dependencies in virtual env
ENV PAPERMERGE_VENV=/venv

RUN apt-get update;
RUN apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    gcc

RUN pip install --upgrade poetry
RUN python -m venv ${PAPERMERGE_VENV}

RUN VIRTUAL_ENV="${PAPERMERGE_VENV}"
ENV PATH="${PAPERMERGE_VENV}/bin:$PATH"

COPY poetry.lock ./
COPY pyproject.toml ./
RUN poetry install --no-root --no-dev
RUN UWSGI_PROFILE=gevent pip install uwsgi

### STEP 2 - use slim base image
FROM python:3.8-slim

ENV PAPERMERGE_VENV=/venv
ENV PATH="${PAPERMERGE_VENV}/bin:$PATH"
ENV PYTHONBUFFERED=1

RUN apt-get update;
RUN apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    gcc


COPY docker/app/prod/uwsgi.ini /etc/uwsgi/papermerge.ini
COPY docker/app/prod/scripts /
RUN chmod +x /run.bash

COPY --from=build ${PAPERMERGE_VENV} ${PAPERMERGE_VENV}

WORKDIR app

# sources
COPY papermerge/ ./papermerge/
COPY docker/app/prod/config/ ./config/
COPY docker/app/prod/manage.py ./

EXPOSE 8090

ENTRYPOINT ["/run.bash"]
CMD ["server"]


