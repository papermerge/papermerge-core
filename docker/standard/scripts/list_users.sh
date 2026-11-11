#!/bin/sh

cd /auth_server_app && uv run auth-cli users ls "$@"
