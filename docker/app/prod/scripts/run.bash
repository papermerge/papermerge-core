#!/bin/bash

export PATH="/venv/bin:${PATH}"

CMD="$1"
PYTHON="/venv/bin/python"
MANAGE="${PYTHON} manage.py"


if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_server() {
  exec uwsgi --ini /etc/uwsgi/papermerge.ini
}

exec_ws_server() {
  exec daphne --port 8090 config.asgi:application
}

exec_worker() {
  exec celery --app=papermerge worker --loglevel=INFO
}

exec_init() {
  # run migrations
  $MANAGE migrate --no-input

  # user envrironment variables:
  #   (1) DJANGO_SUPERUSER_USERNAME
  #   (2) DJANGO_SUPERUSER_EMAIL
  #   (3) DJANGO_SUPERUSER_PASSWORD
  # to create superuser if (1) and (2) are set
  if [ -n "${DJANGO_SUPERUSER_USERNAME}" ] && [ -n "${DJANGO_SUPERUSER_EMAIL}" ]; then
    echo "Creating superuser username=${DJANGO_SUPERUSER_USERNAME}"
    $MANAGE createsuperuser --noinput \
      --username ${DJANGO_SUPERUSER_USERNAME} \
      --email ${DJANGO_SUPERUSER_EMAIL} || true
  fi
}

case $CMD in
  init)
    exec_init
    ;;
  server)
    exec_server
    ;;
  ws_server)
    exec_ws_server
    ;;
  worker)
    exec_worker
    ;;
  *)
    echo "Unkown command: '$CMD'. Exiting..."
    exit 1
    ;;
esac