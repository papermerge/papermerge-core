#!/bin/sh

cd /auth_server_app && uv run task auth-cli "$@"
