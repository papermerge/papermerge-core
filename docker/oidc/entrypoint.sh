#!/bin/sh

CMD="$1"

if [ -z "$CMD" ]; then
  echo "No command specified"
  exit 1
fi

exec_migrate() {
  echo "Running database migrations..."
  cd /app && alembic upgrade head
  echo "Migrations complete."
}

exec_perms_sync() {
  echo "Syncing permissions..."
  pm perms sync
  echo "Permissions sync complete."
}

exec_create_standard_roles() {
  echo "Creating standard roles..."
  pm roles create-standard-roles
  echo "Standard roles ready."
}

exec_create_system_user() {
  pm users create-system-user
}


exec_init() {
  exec_migrate
  exec_perms_sync
  exec_create_system_user
  exec_create_standard_roles
}

case $CMD in
  init)
    exec_init
    ;;
  migrate)
    exec_migrate
    ;;
  server)
    exec_init
    # Generate runtime config for frontend
    /bin/env2js -f /app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    # Inject runtime config script into index.html
    sed -i '/Papermerge/a\  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
    exec /usr/bin/supervisord -c /app/supervisord.conf
    ;;
  server_without_init)
    # Generate runtime config for frontend
    /bin/env2js -f /app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    # Inject runtime config script into index.html
    sed -i '/Papermerge/a\  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
    exec /usr/bin/supervisord -c /app/supervisord.conf
    ;;
  *)
    exec "$@"
    ;;
esac
