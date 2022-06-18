#!/bin/bash
#
# python -m pytest [...] adds the current directory to sys.path
# pytest [...] DOES NOT add current path to sys.path
#
# Usage:
# ./run-tests.sh [core|search] <optional args to pytest>
#
#  It is convenient to distinguish between types of tests ('core' vs 'search').
#
#  - `search` type tests 1. are very slower  2. they depend on elastic search service
#  - `core` type tests run fast and DO NOT depend on elastic search service
#
#  Example 1: run ALL 'core' type tests
#
#     ./run-tests.sh core
#
#  Example 2: run only selected 'core' type test
#
#     ./run-tests.sh core tests/core/views/test_users.py
#
#  Example 3: run only matching given method name test 'core' type tests
#
#     ./run-tests.sh core -k test_change_user_password
#
#  Example 4: run ALL 'search' type tests
#
#    ./run-tests.sh search
#
#  Example 5: run only selected 'search' type tests
#
#    ./run-tests.sh search tests/search/test_search_view.py
#

exec_tests_core_all() {
  # Run ALL `core` type tests i.e. tests which don't depend on elastic search service
  DJANGO_SETTINGS_MODULE=tests.config.core_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/core/  tests/notifications/ "$@"
}

exec_tests_core_selected() {
  # Run only specific `core` type tests.
  # The arguments to this method are be either a path to specific tests folder or
  # to file or '-k <match>'.
  # Actually any pytest argument is passed to this method
  DJANGO_SETTINGS_MODULE=tests.config.core_settings \
  poetry run \
    python -m pytest \
    "$@"  # select specific tests to run the 'pytest' way
          # optionally add any pytest args e.g. '--disable-warning'
}

exec_tests_search_all() {
  # Run ALL `search` type tests i.e. tests which depend on elastic search service
  DJANGO_SETTINGS_MODULE=tests.config.search_settings \
  poetry run \
    python -m pytest \
    --disable-warnings \
    tests/search/ "$@"
}

exec_tests_search_selected() {
  # Run only specific `search` type tests.
  # The arguments to this method should be either a path to specific tests folder or
  # to file or '-k <match>'.
  # Actually any pytest argument is passed to this method
  DJANGO_SETTINGS_MODULE=tests.config.search_settings \
  poetry run \
    python -m pytest \
    "$@"  # select specific tests to run the 'pytest' way
          # optionally add any pytest args e.g. '--disable-warning'
}

if [ "$1" == "search" ]; then
  # 'search' type tests i.e. tests which depend on elastic search service
  shift 1  # remove the 'search' string from arguments
  if [ -z "$1" ]; then
      exec_tests_search_all "$@"
  else
      exec_tests_search_selected "$@"
  fi

elif [ "$1" == "core" ]; then
  # 'core' type tests i.e. tests which DON'T depend on elastic search
  shift 1  # remove the 'core' string from arguments
  if [ -z "$1" ]; then
    exec_tests_core_all "$@"
  else
    exec_tests_core_selected "$@"
  fi
else # no args supplied
  # just run all the tests (used in CI)
  exec_tests_core_all
  exec_tests_search_all
fi
