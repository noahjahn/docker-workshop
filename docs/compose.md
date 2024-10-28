# Docker compose

## Simplified `docker run`

At the very least, a `docker-compose.yml` file can simplify all of those flags that had to be set on the `docker run` command.

Here is a simple example `docker-compose.yml` that was set up for running this docs project:

```yaml
services:
  bun:
    image: oven/bun
    user: bun:bun
    ports:
      - ${DOCS_MAPPED_PORT:-5173}:5173
    volumes:
      - ./:/home/bun/app
```

Comparing a `docker run` command with that docker-compose file, you can see how some flags just end-up being configuration keys in the yaml file:

```shell
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it oven/bun docs:dev
```

We can't define a few flags in the docker compose file, but we can use the docker compose services on the command line to `run` and `exec` without having to specify as many flags:

```shell
docker compose run --rm -i -P bun docs:dev
```

Where `bun` is the keyed service name.

::: tip
By default, `docker compose run` already allocates a pseudo-TTY, so it doesn't need to be explicitly specified.
:::

::: tip
By default, `docker compose run` will not publish the mapped service ports, so we still need to be explicit here. `-P` is a shortened flag for `--service-ports`.
:::

## Custom Dockerfile

The docker-compose file can be updated to reference the custom Dockerfile that we created previous as well. This is super useful for local development, since you don't have to worry about tagging the image at all, docker will infer the name of the image to build based on the directory name that it's in.

::: code-group

```diff
services:
  bun:
-   image: oven/bun
+   build:
+     context: .
+     dockerfile: Dockerfile
    user: bun:bun
    ports:
      - ${DOCS_MAPPED_PORT:-5173}:5173
    volumes:
      - ./:/home/bun/app
```

```yaml
services:
  bun:
    build:
      context: .
      dockerfile: Dockerfile
    user: bun:bun
    ports:
      - ${DOCS_MAPPED_PORT:-5173}:5173
    volumes:
      - ./:/home/bun/app
```

:::

:::warning

If anything changes in the `Dockerfile`, you will have to explicitly tell Docker to rebuild that image with `docker compose build`
:::

## Updating shell scripts

We can also update the `bun.sh` shell script now to use `docker compose run` commands instead of just `docker run`. We can also make sure that `docker compose build` is executed, so we don't have to think about it for future commands.

:::code-group

```diff
#!/bin/bash
-IMAGE=docker-workshop:latest

-docker pull $IMAGE
-docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it $IMAGE $@
+docker compose pull
+docker compose build
+docker compose run --rm --service-ports bun $@

```

```bash
#!/bin/bash

docker compose pull
docker compose build
docker compose run --rm --service-ports bun $@
```

## Multiple services

Docker compose also allows us to define more than one services, which is especially useful for an app that has external service dependencies, like a database.

You can specify more services in the `services` map of the docker-compose file and each one of those services.

Just as an example, if for some reason we wanted the base bun image and the custom image we created from the bun image, we could do something like this:

```yaml
services:
  bunwithgit:
    build:
      context: .
      dockerfile: Dockerfile
    user: bun:bun
    ports:
      - 5173:5173
    volumes:
      - ./:/home/bun/app
  bun:
    build:
      context: .
      dockerfile: Dockerfile
    user: bun:bun
    ports:
      - 5174:5173
    volumes:
      - ./:/home/bun/app
```

Or, if this project required a database, we could also add that as a service:

```yaml
services:
  bun:
    build:
      context: .
      dockerfile: Dockerfile
    user: bun:bun
    ports:
      - ${DOCS_MAPPED_PORT:-5173}:5173
    volumes:
      - ./:/home/bun/app
  database:
    image: postgres:17
    restart: unless-stopped
    ports:
      - 5432:5432
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: ${DB_DATABASE:-postgres}
```

## Networking

When using docker compose, each of those services that are defined in the map are going to by default be part of the same docker network. They are also going to be able to communicate with each other. Docker compose will create some custom DNS for the reaching each container by its defined service name.

What this means is, if the app running the `bun` service required a database connection, it could reference the database by its service name as `database`. If it was using environment variables then, it might have its configuration of `DB_HOST` set to "database".
