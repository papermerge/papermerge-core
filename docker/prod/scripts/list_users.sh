#!/bin/bash

VIRTUAL_ENV=/auth_server_app/.venv
cd /auth_server_app
poetry run list_users
