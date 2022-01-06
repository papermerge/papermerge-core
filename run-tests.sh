#!/bin/bash

# python -m pytest [...] adds the current directory to sys.path
# pytest [...] DOES NOT add current path to sys.path

if [ "$1" == "search" ]; then
  DJANGO_SETTINGS_MODULE=tests.config.search_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/search/
fi

if [ "$1" == "core" ]; then
  DJANGO_SETTINGS_MODULE=tests.config.core_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/core/
fi

