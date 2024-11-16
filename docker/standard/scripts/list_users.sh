#!/bin/sh

cd /auth_server_app && poetry run task auth-cli "$@"
