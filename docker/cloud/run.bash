#!/bin/bash

CMD="$1"

mkdir -p /db  # default database is /db/db.sqlite3

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

exec_migrate() {
  echo "Applying migrations..."
  export VIRTUAL_ENV=/core_app/venv
  cd /core_app && poetry run python manage.py migrate --no-input
  echo "Done!"
}

exec_perms_sync() {
  echo "Syncing permissions..."
  export VIRTUAL_ENV=/core_app/venv
  cd /core_app && poetry run perms sync
  echo "Done!"
}

exec_create_admin_group() {
  echo "Creating 'admin' group..."
  export VIRTUAL_ENV=/core_app/venv
  cd /core_app && poetry run groups create-admin
  echo "Done!"
}

exec_index_schema_apply() {
  echo "Applying index schema..."
  export VIRTUAL_ENV=/core_app/venv
  cd /core_app && poetry run index_schema apply
  echo "Done!"
}

exec_runtime_config_js() {
  echo "roco: generating runtime config..."
  roco > /usr/share/html/ui/runtime/config.js
  echo "Done!"
}

exec_init() {
  exec_migrate
  exec_perms_sync
  exec_create_admin_group
  exec_runtime_config_js
}

case $CMD in
  init)
    exec_init
    ;;
  index_schema_apply)
    exec_index_schema_apply
    ;;
  server)
    exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
    ;;
  *)
    exec "$@"
    ;;
esac
