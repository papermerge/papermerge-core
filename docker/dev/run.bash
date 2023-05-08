#!/bin/bash

CMD="$1"
MANAGE="${PYTHON} manage.py"

if [ -z "${DJANGO_SETTINGS_MODULE}" ]; then
  # default value for DJANGO_SETTINGS_MODULE environment variable
  export DJANGO_SETTINGS_MODULE=config.settings
fi

if [ -z "${DJANGO_SUPERUSER_USERNAME}" ]; then
  # default value for DJANGO_SUPERUSER_USERNAME environment variable
  export DJANGO_SUPERUSER_USERNAME=admin
fi

if [ -z "${DJANGO_SUPERUSER_EMAIL}" ]; then
  # default value for DJANGO_SUPERUSER_EMAIL environment variable
  export DJANGO_SUPERUSER_EMAIL=admin@example.com
fi

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_server() {
  exec /usr/bin/supervisord
}

exec_migrate() {
  # run migrations
  $MANAGE migrate --no-input
}

exec_update_index() {
  # Create/Update search index
  $MANAGE update_index &
}

exec_createsuperuser() {
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

exec_worker() {
  exec /core_app/.venv/bin/celery --app config worker \
   -n "worker-node-${HOSTNAME}@papermerge" ${PAPERMERGE__WORKER__ARGS}
}

exec_init() {
  exec_migrate
  exec_createsuperuser
  exec_update_index
}

case $CMD in
  init)
    exec_init
    ;;
  migrate)
    exec_migrate
    ;;
  createsuperuser)
    exec_createsuperuser
    ;;
  server)
    exec /usr/bin/supervisord
    ;;
  worker)
    exec_worker
    ;;
  *)
    $MANAGE $@
    ;;
esac
