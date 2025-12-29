#!/bin/sh

CMD="$1"

if [ -z $CMD ]; then
  echo "No command specified"
  exit 1
fi

# Auto-generate secret key if not provided (for non-production use)
if [ -z "${PM_SECRET_KEY}" ]; then
  echo "WARNING: PM_SECRET_KEY not set. Auto-generating a random key."
  echo "This is NOT suitable for production. Please set PM_SECRET_KEY explicitly."
  export PM_SECRET_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '+/=' | head -c 64)
  echo "Generated secret key: ${PM_SECRET_KEY:0:16}... (truncated for display)"
fi

# Set default auth username and email if not provided
if [ -z "${PM_USERNAME}" ]; then
  echo "PM_USERNAME not set. Using default: admin"
  export PM_USERNAME="admin"
fi

if [ -z "${PM_EMAIL}" ]; then
  echo "PM_EMAIL not set. Using default: admin@example.com"
  export PM_EMAIL="admin@example.com"
fi

exec_migrate() {
  cd /core_app && uv run task migrate
}

exec_perms_sync() {
  cd /core_app && uv run pm perms sync
}

exec_create_system_user() {
  cd /core_app && uv run pm users create-system-user
}

exec_create_standard_roles() {
  echo "Creating standard roles..."
  cd /core_app && uv run pm roles create-standard-roles
  echo "Standard roles ready."
}

exec_createsuperuser() {
  cd /auth_server_app && uv run auth-cli users create --superuser
}


exec_init() {
  exec_migrate
  exec_perms_sync
  exec_create_system_user
  exec_create_standard_roles
  exec_createsuperuser
}

if [[ -n "${NODE_NAME}" ]]; then
  # if NODE_NAME is present it means worker runs inside k8s cluster
  echo "NODE_NAME is set to ${NODE_NAME}"

  if [[ -z "${PAPERMERGE__MAIN__S3_QUEUE_NAME}" ]]; then
    echo "PAPERMERGE__MAIN__S3_QUEUE_NAME not set yet"
    echo "Will set now PAPERMERGE__MAIN__S3_QUEUE_NAME to a value based on"
    echo " PAPERMERGE__MAIN__PREFIX and node name."
    export PAPERMERGE__MAIN__S3_QUEUE_NAME="s3_${PAPERMERGE__MAIN__PREFIX}_${NODE_NAME}"
  fi

  if [[ -z "${PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME}" ]]; then
    echo "PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME not set yet"
    echo "$NODE_NAME is non-empty"
    echo "Will set now PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME to a value based on"
    echo " PAPERMERGE__MAIN__PREFIX and node name."
    export PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME="s3preview_${PAPERMERGE__MAIN__PREFIX}_${NODE_NAME}"
  fi
  echo "PAPERMERGE__MAIN__S3_QUEUE_NAME queue name set to: $PAPERMERGE__MAIN__S3_QUEUE_NAME"
  echo "PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME queue name set to: $PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME"
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
    /bin/env2js -f /core_app/core.js.tmpl  > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    # Once user options endpoint is implemented, following two lines will removed
    /bin/env2js -f /core_app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    sed -i '/Papermerge/a  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
    exec /usr/bin/supervisord -c /core_app/supervisord.conf
    ;;
  server_without_init)
    /bin/env2js -f /core_app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    sed -i '/Papermerge/a  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
    exec /usr/bin/supervisord -c /core_app/supervisord.conf
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
