FROM python:3.8 as build

### STEP 1 - pull all python dependencies in virtual env
ENV IN_DOCKER=1
ENV POETRY_VIRTUALENVS_CREATE=false
ENV UWSGI_PROFILE=gevent
ENV VIRTUAL_ENV=/venv

RUN apt-get update;
RUN apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    gcc

RUN pip install --upgrade poetry
RUN python -m venv /venv

ENV PATH="/venv/bin:$PATH"

COPY poetry.lock pyproject.toml /
RUN poetry install --no-root --no-dev -vvv

## STEP 2 - use slim base image
FROM python:3.8-slim

ENV PATH="/venv/bin:$PATH"
ENV PYTHONBUFFERED=1
ENV VIRTUAL_ENV=/venv

RUN apt-get update;
RUN apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    postgresql-client \
    tesseract-ocr \
    tesseract-ocr-deu \
    imagemagick \
    git \
    libmagic1 \
    ghostscript \
    file \
    gcc

COPY docker/prod/uwsgi.ini /etc/uwsgi/papermerge.ini
COPY docker/prod/scripts /
RUN chmod +x /run.bash

COPY --from=build /venv /venv

WORKDIR app

# sources
COPY papermerge/ ./papermerge/
COPY docker/prod/config/ ./config/
COPY docker/prod/manage.py ./

EXPOSE 8000

ENTRYPOINT ["/run.bash"]
CMD ["server"]
