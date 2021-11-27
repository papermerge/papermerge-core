#!/bin/bash

# python -m pytest [...] adds the current directory to sys.path
# pytest [...] DOES NOT add current path to sys.path
poetry run python -m pytest --disable-warnings
