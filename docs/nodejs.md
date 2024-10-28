# Node.js example

Here is another example combining the different ideas and commands we've gone over. This example will walk through setting up an Express app with Node.js

### References

- Node Docker Hub image: https://hub.docker.com/_/node
- Express install guide: https://expressjs.com/en/starter/installing.html

## Figuring out what we don't know

### Express requirements

Following the [Express install guide](https://expressjs.com/en/starter/installing.html), we know we'll need at least Node v18 (we'll just go with LTS though). We'll also need npm (Node's package manager) to install and initialize Express.

### Node image

Before we get too far, we need to actually find a base image that we can go off of. A quick [search on Docker Hub](https://hub.docker.com/search?q=node) leads us to the official [Node](https://hub.docker.com/_/node) Docker image. We can use this as our base.

```shell
docker pull node:lts
```

With the `node:lts` image pulled down, we can do a few quick tests in the image to see what we have to work with:

```shell
# Check node version
docker run --rm -it node:lts node --version

# Check npm version
docker run --rm -it node:lts npm --version

# See if the is a user with a home directory we can use
docker run --rm -it node:lts ls -al /home
docker run --rm -it node:lts whoami # root, though there is a node user we can use
```

Node and npm are both installed and accessible and the versions meet Express's requirements. There is a node user that we can use to execute commands in the container.

## Install Express

For this example, we're going to create a new directory for our Django app to live in

```shell
mkdir express && cd express
```

Let's try to initialize the package with the node user and see what happens. I'm going to set the working directory to `/home/node/app` and create a bind-mount volume for our `express` directory to be mounted to the `/home/node/app` directory in the container.

```shell
docker run --rm -it -w /home/node/app -v ./:/home/node/app --entrypoint=npm --user node node:lts init
```

And here we can install express

```shell
docker run --rm -w /home/node/app -v ./:/home/node/app --entrypoint=npm --user node node:lts install express
```

## Setup Hello World example

Still following the Express guide, we can add the [Hello World](https://expressjs.com/en/starter/hello-world.html) example implementation.

We can create a `app.js` file in the `express` directory.

```shell
touch app.js
```

Then we can write the following content to the file:

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
```

## Running the express server

We can see that the port that the app will be listening on is port 3000, so we can write a `docker run` command to test this out.

```shell
docker run --rm --init -w /home/node/app -v ./:/home/node/app -p 3000:3000 --user node node:lts node app.js

```

::: info

I added the `--init` flag here because the container wasn't responding to ctrl+c signals.
:::

You should be able to see "Hello World" in your browser now if you go to http://localhost:3000

## Setting up docker compose and shell script files

We can start making our lives a bit easier by setting up a docker compose file, so we don't have to remember all of these flags that need to be included during a run command, then set up shell scripts to wrap the `docker compose` commands after that.

```shell
touch docker-compose.yml
```

The `docker-compose.yml` file will have the following contents (derived from all the flags that were being used in the previous `docker run` command)

```yaml
services:
  node:
    image: node:lts
    user: node
    ports:
      - 3000:3000
    init: true
    working_dir: /home/node/app
    volumes:
      - ./:/home/node/app
```

Create the bin directory as well as two shell scripts that help us wrap running `npm` and any command in the node container service. The shell scripts need to be executable, and we can make symlinks to them in the root of the `express` directory.

```shell
mkdir -p bin
touch bin/npm.sh bin/node.sh
chmod +x bin/*.sh
ln -s bin/npm.sh ./npm
ln -s bin/node.sh ./node
```

Contents of the `npm.sh` file:

```bash
#!/bin/bash

mkdir -p node_modules

docker compose run --rm --service-ports --entrypoint=npm node $@
```

Test to make sure the pip shell script works:

```shell
./npm install
```

Contents of the `node.sh` file:

```bash
#!/bin/bash

mkdir -p node_modules

docker compose run --init --rm --service-ports --entrypoint=node node $@

```

Test to make sure the node shell script works:

```shell
./node app.js
```
