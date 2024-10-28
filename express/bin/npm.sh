#!/bin/bash

mkdir -p node_modules

docker compose run --rm --service-ports --entrypoint=npm node $@
