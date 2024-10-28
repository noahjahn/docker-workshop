---
prev:
  text: 'Introduction'
  link: '/introduction'
---

# Docker CLI

To start showcasing the Docker CLI, I'm going to work through a few examples of setting up and working with this repo with some `docker` commands.

## Setup

If you plan to follow along, and you haven't already, take a moment to clone down this repo:

```shell
git clone https://github.com/noahjahn/docker-workshop.git && cd docker-workshop
```

Ensure you can run `docker` from the terminal (you should see a printed out Docker version and build number):

```shell
docker --version
```

> This project contains docs written in Markdown, which get parsed and built into static HTML files by [Vitepress](https://vitepress.dev/). [Bun](https://bun.sh/) is currently used for the package manager as well as for any build and run-time tasks.

::: info
I chose Bun, hoping that most of us wouldn't already have it installed on our system. The goal being: we can see how to take advantage of Docker to still run this project without having to install any host or OS level dependencies. Outside of Docker, of course.
:::

## Install bun packages

With any JavaScript project, we'll need to install some packages defined in the `package.json`

```shell
docker run oven/bun i
```

::: info
`oven/bun` is the official [Bun Docker image](https://hub.docker.com/r/oven/bun)
:::

::: info
If you don't already have the `oven/bun` Docker image pulled down then the current `latest` tag will be pulled down, otherwise you'll run an existing downloaded image that matches the `oven/bun` tag
:::

::: warning
`docker run` doesn't pull the latest image for you, so you may be running an older `oven/bun` image version. You can make sure to download the latest image by running `docker pull oven/bun`
:::

You should receive an error saying something about the `package.json` file could not be found. This is because we are executing `bun i` _inside_ the container, which doesn't know anything about the current directory that we executed the command from. So, even though there is a `package.json` file in the repo, the location that the `bun i` command is actually executed _does not_ contain the `package.json` file.

## List containers

The container we ran is now in a stopped state and can be seen by running:

```shell
docker ps --all
```

::: tip
`--all` can be shortened to just `-a`. It means to show all containers, whereas by default the command will only show running containers
:::

## Remove containers

I like to remove my stopped containers after I'm finished with them, so I don't have a bunch of containers in this stopped state, just to keep things cleaned up. You'll want to copy the container ID from the previous command to paste in place of `CONTAINER` below:

```shell
docker container rm CONTAINER
```

::: tip
Whenever I use the `docker run` command, I will add the `--rm` flag, which will automatically remove the container and it's associated anonymous volumes when it exists
:::

## Volumes

The container needs to know about the `package.json` that we have in the repo. One way to approach this is to create a bind-mount docker volume. But we need to know what the working directory is to for the bun image that we're using.

::: info

The bind-mount volume is a great feature to use in local development. The directory that is bind-mounted will stay up-to-date with any changes that are made in that directory in the container.
:::

A quick way to figure out the working directory of the Docker image you're using would be to execute the `pwd` command inside the container. Specifically with this container though, the `entrypoint` is configured to be the `bun` executable. So we'll need to make sure to override that in our `docker run` command:

::: code-group

```shell
docker run --rm --entrypoint= oven/bun pwd
```

```shell
docker run --rm --entrypoint=pwd oven/bun
```

:::

We should see the output to be `/home/bun/app`.

::: info
You can also override the working directory of the image with the `--workdir`, or `-w` for short, flag
:::

Now that we know where we should create the bind-mount volume we can do that with the `--volume` or `-v` flag:

```shell
docker run --rm -v ./:/home/bun/app oven/bun i
```

::: tip
The left-hand side of the `:` specifies the path on the host machine, your computer, to be mounted to the path on the right-hand side inside the container
:::

## User

::: danger
If you notice, after running `ls -al`, the `node_modules` directory and the `bun.lockb` file are going to have the owner and group `root`. Typically, containers should be run as a non-root user even in production. Locally, it's a great idea to run the container as the same user as your user ID on the host computer.
:::

::: danger
It's also important to note that, in general, you _shouldn't_ have to execute docker commands as root with `sudo`.
:::

You can specify the user you want the container to run as with the `--user` flag. You can pass in either usernames (that exist within the container) or UIDs. If you want files to be created with your host users' ID, then you should pass in your UID. Check what your UID is by running the following:

```shell
echo $UID
```

::: info
In some cases, a user is going to already be created in the image with the 1000 user ID, so when the container is running, it may have a different name than your username on your host computer.
:::

We should install packages again, so they're created with the correct user ID. First, we'll need to remove the files that were created as the root user:

```shell
sudo rm -rf ./node_modules
sudo chown $UID:$UID bun.lockb
```

Now, we can run the docker run command with the `--user` flag

```shell
docker run --rm -v ./:/home/bun/app --user $UID oven/bun i
```

To confirm permissions are correct, run the `ls -al` command again and you should see the `node_modules` directory is created as your user.

## Publish

At this point, the packages to run `vitepress` to build, serve, or preview these docs locally should all be downloaded and in place now. Looking at the `package.json` file, there is a `docs:dev` script, that will run the `vitepress` development server for the docs.

We can run the `docs:dev` script using [`bun run`](https://bun.sh/docs/cli/run#run-a-package-json-script) with our `docker run` command:

```shell
docker run --rm -v ./:/home/bun/app --user $UID oven/bun docs:dev
```

Once the docs build, the server will say that it's running on port 5173. But, if you try to go to http://localhost:5173 in your browser, you won't see anything running there. The reason being is we haven't mapped the required ports between the host computer and the container that is executing.

You can `ctrl+c` or `cmd+c` to send the interrupt to stop the container

Vitepress told us the port that is being used (5173), so we can map that to our host computer (as long as nothing else is on that port of course):

```shell
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID oven/bun docs:dev
```

::: tip
Similarly to how the bind-mount volume works, the left-hand side of the `:` specifies the port on the host machine to be mapped to the port on the right-hand side inside the container
:::

Visiting http://localhost:5173 in your browser should show you these docs now!

## Interactive and pseudo-TTY

The Vitepress dev server provides some interactive commands that can be used while the server is running, but the container doesn't know about any "attached" terminal or interface device without us explicitly telling it. So, of course, there is a few more flags

If you haven't already, you can send the interrupt signal with `ctrl+c` or `cmd+c` again in your terminal that's running the container

We can allocate a pseudo-TTY with the `-t` flag:

```shell
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -t oven/bun docs:dev
```

You should see some colors on the terminal now, as well as `press h to show help` from `vitepress`. The container still isn't accepting any input from you though, it's still just displaying its stdout.

Send the interrupt signal with `ctrl+c` or `cmd+c` again in your terminal that's running the container.

We'll also tell the container to be interactive with the `-i` flag:

```shell
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it oven/bun docs:dev
```

::: tip
The `-it` flags often get used together.
:::

Now typing `h` with the vitepress container terminal in focus, should actually allow you to interact with the server.

## Exec

Sometimes, you won't need to run a separate docker container for a command. For example: if you have an existing container running, that is executing a script that is writing files to a temporary location in the container, and you want to list the files in that temporary directory, you can do so using `docker exec`.

First though, you'll need to grab the container ID. In a new terminal, run:

```shell
docker ps
```

Copy the ID of the bun container that is running and paste it in place of `CONTAINER` below:

```shell
docker exec CONTAINER ls -al /tmp
```

This will execute `ls -al /tmp` inside the container and then close the shell once it's complete. It will not stop or exit the container.

::: tip run vs exec

`docker run` will always start a new container with the command you specified whereas `docker exec` expects a container to already be running. The command passed in to the `docker exec` command will be executed in the already running container.
:::
