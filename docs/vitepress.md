# Hosting these docs in a container

These docs are currently build and then statically hosted using GitHub pages, but I think it would be cool to also show you what it might look like to host these on your own from a container.

There is already a build process, so we can take what is there and throw the steps that are run in a pipeline for build the docs into a Dockerfile. We will also need a web server that can serve static files. We'll use nginx for this.

## Building the static site

First things first is creating a Dockerfile for us to use. To not overwrite the previous `Dockerfile` we created, we can just create a new one called `Dockerfile.production` in the root of the project.

```shell
touch Dockerfile.production
```

To build the app we're going to need to use Bun, so we can start off pull from the `oven/bun` image. We can also name our stage as `build` since that's what we're doing here now. So we can write the following to the Dockerfile:

```Dockerfile
FROM oven/bun AS build

```

We can also add the `RUN` instruction for install `git`

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

We'll need to install bun dependencies and the run the build script, but before that we'll need to get the code in the repo. To keep the size of the image as small as possible, we can intelligently include the files and directories that are actually needed to build the server.

::: code-group

```diff
FROM oven/bun AS build

RUN apt update && apt install -y git
+
+ADD jsconfig.json /home/bun/app/jsconfig.json
+ADD bun.lockb /home/bun/app/bun.lockb
+ADD package.json /home/bun/app/package.json
+ADD docs /home/bun/app/docs

```

```Dockerfile
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

```

:::

Now we just need to add the install and build `RUN` instructions

::: code-group

```diff
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs
+
+RUN bun i
+
+RUN bun docs:build

```

```Dockerfile
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

RUN bun i

RUN bun docs:build

```

:::

That should be complete for the build stage

## Serve the content with Nginx

Nginx provides a [Docker image ](https://hub.docker.com/_/nginx) that we can use to copy the output of the build stage to serve the static content. From their Docker Hub page, that's all we need to do is copy the content to a single directory.

```Dockerfile
FROM nginx
COPY static-html-directory /usr/share/nginx/html

```

So, let's add a new stage to our Dockerfile

::: code-group

```diff
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

RUN bun i

RUN bun docs:build
+
+FROM nginx

```

```Dockerfile
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

RUN bun i

RUN bun docs:build

FROM nginx

```

:::

Then, we can add a `COPY` instruction to copy the output from the build stage to the directory nginx by default serves static content

::: code-group

```diff
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

RUN bun i

RUN bun docs:build

FROM nginx
+
+COPY --from=build /home/bun/app/docs/.vitepress/dist /usr/share/nginx/html


```

```Dockerfile
FROM oven/bun AS build

RUN apt update && apt install -y git

ADD jsconfig.json /home/bun/app/jsconfig.json
ADD bun.lockb /home/bun/app/bun.lockb
ADD package.json /home/bun/app/package.json
ADD docs /home/bun/app/docs

RUN bun i

RUN bun docs:build

FROM nginx

COPY --from=build /home/bun/app/docs/.vitepress/dist /usr/share/nginx/html

```

:::

Finally, we can build the Dockerfile to an image and give a tag so we can run it to test it

```shell
docker build -t docker-workshop-production -f Dockerfile.production .
docker run --rm -p 8080:80 docker-workshop-production
```

And you should be able to see the site in your browser at http://localhost:8080

:::info

Nginx is listening on port 80 by default, but we chose to map it to port 8080 on our host machine
:::
