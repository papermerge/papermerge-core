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
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run ./manage.py migrate --no-input
}

exec_createsuperuser() {
  VIRTUAL_ENV=/auth_server_app/.venv && cd /auth_server_app/ && poetry install && poetry run create_user || true
}

exec_worker() {
  exec /core_app/.venv/bin/celery --app config worker \
   -n "worker-node-${HOSTNAME}@papermerge" ${PAPERMERGE__WORKER__ARGS}
}

exec_index_schema_apply() {
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run ./manage.py index_schema apply
}

exec_init() {
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry install
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
    VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run ./manage.py index_schema apply
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
