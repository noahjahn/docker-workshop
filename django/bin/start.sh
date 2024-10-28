#!/bin/bash

docker compose pull
docker compose build

./pip install -r requirements.txt

./python python manage.py migrate

docker compose up -d

docker compose logs -f || docker compose down
