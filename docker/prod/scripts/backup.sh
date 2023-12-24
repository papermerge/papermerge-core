#!/bin/bash

VIRTUAL_ENV=/core_app/.venv
cd /core_app
poetry run ./manage.py backup "$@"
