#!/bin/bash

CMD="$1"

mkdir -p /db  # default database is /db/db.sqlite3

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_migrate() {
  # run migrations
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run ./manage.py migrate --no-input
}

exec_perms_sync() {
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run perms sync
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
  exec_perms_sync
  if [[ ! -z "${PAPERMERGE__AUTH__USERNAME}" && ! -z "${PAPERMERGE__AUTH__PASSWORD}" ]]; then
    exec_createsuperuser
  fi
}

rm -f /etc/nginx/nginx.conf
rm -f /etc/papermerge/supervisord.conf

if [[ -z "${PAPERMERGE__AUTH__REMOTE}" ]]; then
  ln -s /etc/papermerge/supervisord.default.conf /etc/papermerge/supervisord.conf
  ln -s /etc/nginx/nginx.default.conf /etc/nginx/nginx.conf
else
  ln -s /etc/papermerge/supervisord.remote.conf /etc/papermerge/supervisord.conf
  ln -s /etc/nginx/nginx.remote.conf /etc/nginx/nginx.conf
fi

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
    roco > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
    ;;
  worker)
    exec_init
    exec_worker
    ;;
  backup.sh)
    exec backup.sh "$2"
    ;;
  restore.sh)
    exec restore.sh "$2"
    ;;
  create_token.sh)
    exec create_token.sh "$2"
    ;;
  list_users.sh)
    exec list_users.sh
    ;;
  *)
    exec "$@"
    ;;
esac
