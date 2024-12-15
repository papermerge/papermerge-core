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
  echo "exec_index_schema_apply"
  if [ -n "${PAPERMERGE__SEARCH__URL}" ]; then
    # PAPERMERGE__SEARCH__URL has non-empty value
    echo "PAPERMERGE__SEARCH__URL=${PAPERMERGE__SEARCH__URL}"
    echo "Applying index schema..."
    cd /core_app && poetry run paper-cli index-schema apply
  fi
}

exec_init() {
  exec_migrate
  exec_perms_sync
  exec_createsuperuser
  exec_index_schema_apply
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
    # TODO: replace roco with env2js
    roco > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    # Once user options endpoint is implemented, following two lines will removed
    /bin/env2js -f /core_app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    sed -i '/Papermerge/a  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
    exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
    ;;
  server_without_init)
    # TODO: replace roco with env2js
    roco > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    # Once user options endpoint is implemented, following two lines will removed
    /bin/env2js -f /core_app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    sed -i '/Papermerge/a  <script type="module" src="/papermerge-runtime-config.js"></script>' /usr/share/nginx/html/ui/index.html
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
