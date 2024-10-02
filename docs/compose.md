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
By default, `docker compose run` already allocates a psuedo-TTY, so it doesn't need to be explicitly specified.
:::

::: tip
By default, `docker compose run` will not publish the mapped service ports, so we still need to be explicit here. `-P` is a shortened flag for `--service-ports`.
:::

## Multiple services

Docker compose also allows us to define more than one services, which is especially useful for an app that has external dependencies like a database.

TODO: more in-depth about this with some examples
