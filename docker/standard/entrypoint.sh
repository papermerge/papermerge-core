#!/bin/sh

CMD="$1"

mkdir -p /db  # default database is /db/db.sqlite3

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_migrate() {
  cd /core_app && poetry run task migrate
}

exec_perms_sync() {
  cd /core_app && poetry run paper-cli perms sync
}


exec_createsuperuser() {
  cd /auth_server_app && poetry run auth-cli users create --superuser
}

exec_index_schema_apply() {
  VIRTUAL_ENV=/core_app/.venv && cd /core_app && poetry run ./manage.py index_schema apply
}

exec_init() {
  exec_migrate
  exec_perms_sync
  exec_createsuperuser
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
    roco > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    roco > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
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
