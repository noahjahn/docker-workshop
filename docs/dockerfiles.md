# Dockerfiles

So far, we've been pulling from existing Docker images. Sometimes though, the image that you're pulling from may not have all the OS-level dependencies that are required for your app to work completely.

As an example, Vitepress has a feature that allows last updated date and timestamps to be shown on the documentation page. Essentially, it uses git under the hood to check the source code for the page you're viewing to see when the last commit was. The `oven/bun` image does not include `git`, so we can create a Dockerfile that pulls from the base image to add that dependency.

To start, open the `docs/.vitepress/config.mts` file and add the `lastUpdated` flag to the config object:

```diff
  ...
    },
  },
  ignoreDeadLinks: 'localhostLinks',
+  lastUpdated: true,
});
```

After that saves and the Vitepress server reloads (or if the dev server isn't running you can start it now with `./bun docs:dev`), open up the docs site and try to load one of the documentation pages. You should see an error saying that `git` cannot be found.

## Dockerfile

To install `git` in the container, we'll want to build a Dockerfile that pulls from the base image we're already pulling from. We can start by creating a Dockerfile in the root of the project directory.

```shell
touch Dockerfile
```

We can also add the initial `FROM` instruction, which will be the base image that we're building from.

```Dockerfile
FROM oven/bun

```

To install `git` we can simply add a `RUN` instruction to the Dockerfile that updates the package repository and installs git

::: code-group

```diff
FROM oven/bun
+
+RUN apt update && apt install -y git

```

```Dockerfile
FROM oven/bun

RUN apt update && apt install -y git

```

:::

:::info
Each instruction that is specified in a Dockerfile is a "layer" added on top of all the other layers that the base image your pulling from includes (we can talk a bit more about this in the optimizing section)
:::

:::info
Images can be based on any number of "base" Linux distribution's, which means package managers and how you install additional dependencies can vary. The `oven/bun` image is based on Debian, so we have the `apt` package manager
:::

## Building Dockerfiles

With the Dockerfile created, we can run the `docker build` command to instruct docker to read the Dockerfile and perform the list of instructions we added.

```shell
docker build -f Dockerfile .
```

:::info
The `-f` flag here is just going to be the path to the file that we want to build
:::

:::info
The `.` in this case is the build context. This is important if you are use the `COPY` or `ADD` instructions since the context is going to be the path from which the build will look for files to be copied from on the host.
:::

### Tagging

The image you build doesn't actually have a tag right now, so we can't use it. We can add the `-t` flag to give it a name that we can reference it by

```shell
docker build -t docker-workshop -f Dockerfile .
```

By default, the namespace is going to look like "name:tag". Since we didn't actually specify a tag here, the default tag is going to be "latest". You can find the built image if you run `docker image ls | grep docker-workshop`.

You can add more tags to an already built Docker image, without having to rebuild as well

```shell
docker tag docker-workshop:latest docker-workshop:test
```

You should see both of them after running `docker image ls | grep docker-workshop` again.

### Publishing

When you're publishing to specific container registries, they might require a specific naming convention for the tag's namespace. In AWS, for example, the namespace has to be the container registry name.

## Testing out Vitepress with the updated Dockerfile

Now that we have a tagged image with git installed, we can update the `bin/bun.sh` file to reference our custom image.

:::code-group

```diff
#!/bin/bash

-IMAGE=oven/bun:latest
+IMAGE=docker-workshop:latest

docker pull $IMAGE
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it $IMAGE $@

```

```bash
#!/bin/bash

IMAGE=docker-workshop:latest

docker pull $IMAGE
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it $IMAGE $@

```

:::

If you haven't already, send an interrupt to the Vitepress dev server terminal, then start it up again. This time, it should be using your custom image and the last updated feature should be working.

```shell
./bun docs:dev
```

## Optimizing Dockerfiles

I mentioned briefly that Dockerfiles just contain a set of instructions and each of those instructions correspond to a layer on the image. When an image is built, each one of those layers get stored in Docker's build cache on your computer. That cache is there to help improve build times. The cache for a layer is broken when a previous layer _above_ the instruction has changed. Any instruction that is defined after the instruction that changed will have its cache broken, and it will need to be rebuilt.

Keeping the caching layer aspect in mind there are a number of ways Dockerfiles can be optimized, but they are going to be app specific.

Let's say for example a Dockerfile for an app looks like this:

```Dockerfile
FROM oven/bun

RUN apt update && apt install -y curl && \
  curl https://www.google.com > /app/curl.www.google.com.html && \
  apt install -y wget && \
  wget https://www.google.com && mv index.html wget.www.google.com/html

COPY src /app

```

### Create more layers

The `RUN` instruction kind of long, and could possibly be broken up into a few different layers to become:

```Dockerfile
RUN apt update && apt install -y curl wget

RUN curl https://www.google.com > /app/curl.www.google.com.html && \
  wget https://www.google.com && mv index.html wget.www.google.com/html
```

:::info
Having more layers gives the image more of an opportunity to actually use each layers cache.
:::

### Copy files intelligently

The `COPY` instruction might contain all the source code that reads those two files that get created. Perhaps the `src` directory has a bunch of different subdirectories though and some of those subdirectories don't change as often as the others. Maybe there is a system library or configuration directory of some sort that doesn't change as often. That `COPY` instruction could be broken up into multiple instructions:

```Dockerfile
COPY src/system /app/system
COPY src/config /app/config
COPY src/models /app/models
COPY src/controllers /app/controllers
COPY src/services /app/services
```

### Multi-stage builds

The code copying and curl/wget requests could be separated into multi-stage builds. The multi-staging build will let more than one set of layers be built simultaneously, up to the point where one image might depend on another.

```Dockerfile
FROM debian AS build

RUN apt update && apt install -y curl wget

RUN curl https://www.google.com > /app/curl.www.google.com.html && \
  wget https://www.google.com

FROM oven/bun AS runtime

COPY src/system /app/system
COPY src/config /app/config
COPY src/models /app/models
COPY src/controllers /app/controllers
COPY src/services /app/services
COPY --from=build /app/curl.www.google.com.html ./app/curl.www.google.com.html
COPY --from=build /app/index.html ./app/wget.www.google.com.html
```
