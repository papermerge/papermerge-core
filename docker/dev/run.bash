#!/bin/bash

CMD="$1"
MANAGE="cd /core_ui && poetry run manage.py"

mkdir -p /db  # default database is /db/db.sqlite3

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_server() {
  exec /usr/bin/supervisord
}

exec_migrate() {
  # run migrations
  cd /core_app && poetry run ./manage.py migrate --no-input
}


exec_createsuperuser() {
  # user envrironment variables:
  #   (1) DJANGO_SUPERUSER_USERNAME
  #   (2) DJANGO_SUPERUSER_EMAIL
  #   (3) DJANGO_SUPERUSER_PASSWORD
  # to create superuser if (1) and (2) are set
  if [ -n "${DJANGO_SUPERUSER_USERNAME}" ] && [ -n "${DJANGO_SUPERUSER_EMAIL}" ]; then
    echo "Creating superuser username=${DJANGO_SUPERUSER_USERNAME}"
    cd /core_app && poetry run ./manage.py createsuperuser --noinput \
      --username ${DJANGO_SUPERUSER_USERNAME} \
      --email ${DJANGO_SUPERUSER_EMAIL} || true
  fi
}

exec_worker() {
  exec /core_app/.venv/bin/celery --app config worker \
   -n "worker-node-${HOSTNAME}@papermerge" ${PAPERMERGE__WORKER__ARGS}
}

exec_index_schema_apply() {
  exec /core_app/.venv/bin/python manage.py index_schema apply
}

exec_init() {
  exec_migrate
  exec_createsuperuser
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
    exec_init
    poetry run ./manage.py index_schema apply
    roco > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    exec /usr/bin/supervisord
    ;;
  worker)
    exec_init
    exec_worker
    ;;
  *)
    $MANAGE $@
    ;;
esac
