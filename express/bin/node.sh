#!/bin/bash

mkdir -p node_modules

docker compose run -i --rm --service-ports --entrypoint=node node $@
