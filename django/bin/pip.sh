#!/bin/bash

docker compose run --rm --entrypoint=python python -m pip $@
