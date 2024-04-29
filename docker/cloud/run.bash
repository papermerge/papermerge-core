#!/bin/bash

CMD="$1"

mkdir -p /db  # default database is /db/db.sqlite3

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_migrate() {
  # run migrations
  VIRTUAL_ENV=/core_app/venv && cd /core_app && poetry run ./manage.py migrate --no-input
}

exec_perms_sync() {
  VIRTUAL_ENV=/core_app/venv && cd /core_app && poetry run perms sync
}

exec_index_schema_apply() {
  VIRTUAL_ENV=/core_app/venv && cd /core_app && poetry run ./manage.py index_schema apply
}

exec_init() {
  VIRTUAL_ENV=/core_app/venv && cd /core_app && poetry install
  exec_migrate
  exec_perms_sync
}

rm -f /etc/papermerge/supervisord.conf

case $CMD in
  init)
    exec_init
    ;;
  migrate)
    exec_migrate
    ;;
  server)
    exec_init
    VIRTUAL_ENV=/core_app/venv && cd /core_app && poetry run ./manage.py index_schema apply
    roco > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
    ;;
  *)
    exec "$@"
    ;;
esac
