#!/bin/bash

# python -m pytest [...] adds the current directory to sys.path
# pytest [...] DOES NOT add current path to sys.path

exec_tests_core() {
  DJANGO_SETTINGS_MODULE=tests.config.core_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/core/
}

exec_tests_search() {
  DJANGO_SETTINGS_MODULE=tests.config.search_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/search/
}

if [ "$1" == "search" ]; then
  exec_tests_search
elif [ "$1" == "core" ]; then
  exec_tests_core
else
  exec_tests_core
  exec_tests_search
fi

