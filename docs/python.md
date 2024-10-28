# Python example

To combine some different ideas and commands we've gone over, we're going to walk through setting up a Django project completely Dockerized from scratch. The goal here is to showcase how we can take the implementations we talked about to other web technologies. There are going to be a few roadblocks along the way as well, they're left in here as a way to show _why_ the end result is the way it is.

:::warning

I don't use Python or Django very often, so forgive my ignorance when it comes to any of the development workflows
:::

### References

- Python Docker Hub image: https://hub.docker.com/_/python
- Django install guide: https://docs.djangoproject.com/en/5.1/intro/install/
- Django tutorial: https://docs.djangoproject.com/en/5.1/intro/tutorial01/

## Figuring out what we don't know

### Django requirements

Following the [Django install guide](https://docs.djangoproject.com/en/5.1/intro/install/), we know we'll need Python v3. We'll also need Pip (Python's package manager) to install Django. We'll stick with the default sqlite database to keep this example lean, so we don't need any additional dependencies.

### Python image

Before we get too far, we need to actually find a base image that we can go off of. A quick [search on Docker Hub](https://hub.docker.com/search?q=python) leads us to the official [Python](https://hub.docker.com/_/python) Docker image. We can use this as our base.

```shell
docker pull python:3
```

With the `python:3` image pulled down, we can do a few quick tests in the image to see what we have to work with:

```shell
# Check python version
docker run --rm -it python python --version

# Check pip version
docker run --rm -it python pip --version

# See if the is a user with a home directory we can use
docker run --rm -it python ls -al /home
```

Python and Pip are both installed and accessible and the versions meet Django's requirements. There doesn't seem to be a non-root user in this image though, we may run into permission issues when we try to execute commands in the container as a non-root user.

:::tip
Some images will discuss how to execute their image as a non-root user in their documentation on the Docker Hub page. This Python image does not, though.
:::

## Install Django

For this example, we're going to create a new directory for our Django app to live in

```shell
mkdir django && cd django
```

Let's try to install Django with our UID and see what happens. I'm going to set the working directory to `/app` and create a bind-mount volume for our `django` directory to be mounted to the `/app` directory in the container.

```shell
docker run --rm -w /app -v ./:/app --entrypoint=pip --user $UID python install Django
```

We get a few permission denied errors, so we should create a user in the Docker image that we can use before continuing on.

## Create Dockerfile with a non-root user

Create a file named `Dockerfile` in the `django` directory. We'll pull from the same image that we have been using then add a few Dockerfile instructions to add a non-root user that we can use to install and run the Django app.

```shell
touch Dockerfile
```

```Dockerfile
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

```

With the Dockerfile created, we'll need to build it. We can tag the image with a unique custom tag, so we're not overwriting any other local images that we might have.

```shell
docker build -f Dockerfile -t pythontest .
```

## Try installing Django again

We can try to install Django again. This time, we'll change the working directory and bind-mount volume to be the user profile of the user we added to the Docker image, so we know they'll have write access. We also need to use our `pythontest` tag that we set when we built the image.

```shell
docker run --rm -w /home/python/app -v ./:/home/python/app --entrypoint=pip --user $UID pythontest install Django
```

Django is installed successfully now, so we should freeze these dependencies, so their version can be tracked in source control.

```shell
docker run --rm -w /home/python/app -v ./:/home/python/app --entrypoint=pip --user $UID pythontest freeze > requirements.txt
```

After running that command, the `requirements.txt` file is still empty. This is because the installed dependencies did not persist between container runs. We'll need to make sure those persist so that we don't have to worry about installing each dependency every single time we run a command in the container. Pip is installing the dependencies to `/home/python/.local` and `/home/python/cache`. Both of those directories are outside the `app` directory, so bind-mounting them in a parent directory might be a little strange. This would be a great opportunity to use a docker volume.

Here is the command for adding those two additional volumes, then install Django again:

```shell
docker run --rm -w /home/python/app -v ./:/home/python/app -v python-cache:/home/python/.cache -v python-local:/home/python/.local --entrypoint=pip --user $UID pythontest install Django
```

Another permission denied error! When a volume is created on a directory in the container, the directory unfortunately is created with the root user.

## Update Dockerfile with Pip directories

We can solve the permission denied error that we get now if we just make sure the `.cache` and `.local` directories are already created as part of the image with the correct permissions. We just need to add a few lines to the Dockerfile.

While we're at it, we can do the same thing for the `app` directory, then set the working directory for the container in the image, so we don't have to specify it in our commands.

:::code-group

```diff
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python
+
+# Ensures app, .local, and .cache directories already exist in the image so that volumes can be created with the correct permissions
+RUN mkdir -p /home/python/app /home/python/.local /home/python/.cache
+
+WORKDIR /home/python/app

```

```Dockerfile
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that volumes can be created with the correct permissions
RUN mkdir -p /home/python/app /home/python/.local /home/python/.cache

WORKDIR /home/python/app

```

:::

If you look at the previous output of install dependencies with pip, there is a warning about some scripts missing from the users' PATH. We should update the Dockerfile to ensure the PATH includes the `./local/bin` directory as well.

:::code-group

```diff
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that volumes can be created with the correct permissions
-RUN mkdir -p /home/python/app /home/python/.local /home/python/.cache
+RUN mkdir -p /home/python/app /home/python/.local/bin /home/python/.cache

WORKDIR /home/python/app
+
+# Adds pip binaries to the python user's PATH so the scripts in that directory can be executed from anywhere
+ENV PATH=$PATH:/home/python/.local/bin

```

```Dockerfile
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that volumes can be created with the correct permissions
RUN mkdir -p /home/python/app /home/python/.local/bin /home/python/.cache

WORKDIR /home/python/app

# Adds pip binaries to the python user's PATH so we can execute the scripts
ENV PATH=$PATH:/home/python/.local/bin

```

:::

Since a change was made the Dockerfile, we'll need to rebuild the image. We can just overwrite our test tag for this

```shell
docker build -f Dockerfile -t pythontest .
```

## Hopefully actually install Django this time

Here is our command to try to install Django this time. The command omits the `-w` working directory flag, since we updated the Docker image to include the `WORKDIR` instruction.

```shell
docker run --rm -v ./:/home/python/app -v python-cache:/home/python/.cache -v python-local:/home/python/.local --entrypoint=pip --user $UID pythontest install Django
```

It should have worked now, so we should try to freeze these dependencies again:

```shell
docker run --rm -v ./:/home/python/app -v python-cache:/home/python/.cache -v python-local:/home/python/.local --entrypoint=pip --user $UID pythontest freeze > requirements.txt
```

And now we actually see the dependencies locked as well. We can confirm the dependencies are already installed by trying to install them using the `requirements.txt` file. We should see that the requirements are already satisfied.

```shell
docker run --rm -v ./:/home/python/app -v python-cache:/home/python/.cache -v python-local:/home/python/.local --entrypoint=pip --user $UID pythontest install -r requirements.txt
```

## Setting up docker compose and shell script files

We can start making our lives a bit easier by setting up a docker compose file, so we don't have to remember all of these flags that need to be included during a run command, then set up shell scripts to wrap the `docker compose` commands after that.

```shell
touch docker-compose.yml
```

The `docker-compose.yml` file will have the following contents (derived from all the flags that were being used in the previous `docker run` command)

```yaml
services:
  python:
    build:
      dockerfile: Dockerfile
      context: .
    user: python
    ports:
      - 8000:8000
    volumes:
      - ./:/home/python/app
      - pip-cache:/home/python/.cache
      - pip-local:/home/python/.local

volumes:
  pip-cache:
  pip-local:
```

Create the bin directory as well as two shell scripts that help us wrap running `pip` and any command in the python container service. The shell scripts need to be executable, and we can make symlinks to them in the root of the `django` directory.

```shell
mkdir -p bin
touch bin/pip.sh bin/python.sh
chmod +x bin/*.sh
ln -s bin/pip.sh ./pip
ln -s bin/python.sh ./python
```

Contents of the `pip.sh` file:

```bash
#!/bin/bash

docker compose run --rm --entrypoint=python python -m pip $@

```

Test to make sure the pip shell script works:

```shell
./pip install -r requirements.txt
```

:::info
The dependencies are going to have to be installed again anyway, since defining the volumes in the docker-compose file are technically going to be different docker volumes than the once we used with the `docker run` command
:::

Contents of the `python.sh` file:

```bash
#!/bin/bash

docker compose run --rm python $@

```

Test to make sure the python shell script works (You should see "python"):

```shell
./python whoami
```

## Setting up the Django app

With Django installed now and some wrapping-shell scripts, we can follow the [Django tutorial](https://docs.djangoproject.com/en/5.1/intro/tutorial01/) for setting up the initial app.

After installing Django, we should have a `django-admin` binary that we can execute to set up the Django project:

```shell
./python django-admin startproject app .
```

## Running the Django app

With Django app created, we can use their development server to run and serve the site from the container.

```shell
./python python manage.py runserver
```

Now we have the development server up and running, and we can see the port that is being used by Django. We'll need to publish that port in the `docker-compose.yml` file

:::code-group

```diff
services:
  python:
    build:
      dockerfile: Dockerfile
      context: .
    user: python
+   ports:
+     - 8000:8000
    volumes:
      - ./:/home/python/app
      - pip-cache:/home/python/.cache
      - pip-local:/home/python/.local

volumes:
  pip-cache:
  pip-local:
```

```yaml
services:
  python:
    build:
      dockerfile: Dockerfile
      context: .
    user: python
    ports:
      - 8000:8000
    volumes:
      - ./:/home/python/app
      - pip-cache:/home/python/.cache
      - pip-local:/home/python/.local

volumes:
  pip-cache:
  pip-local:
```

:::

After sending the interrupt signal, we can try to run the development server again now

```shell
./python python manage.py runserver
```

The ports are published now, but we still can't get to http://localhost:8000 in our browser. We need to change the IP address that the development server is bound to. [We can do so](https://docs.djangoproject.com/en/5.1/ref/django-admin/#django-admin-runserver) just by passing in a custom `addressport` as an argument to the `runserver` command.

```shell
./python python manage.py runserver 0.0.0.0:8000
```

The app still can't be reached, and if we take a look at the output of `docker ps` we'll notice the container isn't actually publishing any ports. This is because we are using the `docker compose run` command, which by default doesn't map service ports. We'll need to update the `python.sh` file with the `--service-ports` flag for this to work. We might as well do the same with the `pip.sh` file as well.

Here is the `python.sh` file:

:::code-group

```diff
#!/bin/bash

-docker compose run --rm python $@
+docker compose run --rm --service-ports python $@

```

```bash
#!/bin/bash

docker compose run --rm --service-ports python $@

```

:::

Here is the `pip.sh` file:

:::code-group

```diff
#!/bin/bash

-docker compose run --rm --entrypoint=python python -m pip $@
+docker compose run --rm --service-ports --entrypoint=python python -m pip $@

```

```bash
#!/bin/bash

docker compose run --rm --service-ports --entrypoint=python python -m pip $@

```

:::

Now we can start the development server one last time and see if we can reach the site

```shell
./python python manage.py runserver 0.0.0.0:8000
```

With the known start command, we can update the Docker image one last time with the `CMD` instruction

::: code-group

```diff
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that volumes can be created with the correct permissions
RUN mkdir -p /home/python/app /home/python/.local/bin /home/python/.cache

WORKDIR /home/python/app

# Adds pip binaries to the python user's PATH so we can execute the scripts
ENV PATH=$PATH:/home/python/.local/bin
+
+CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

```

```Dockerfile
FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that we can create volumes to them with the correct permissions
RUN mkdir -p /home/python/app /home/python/.local/bin /home/python/.cache

WORKDIR /home/python/app

# Adds pip binaries to the python user's PATH so we can execute the scripts
ENV PATH=$PATH:/home/python/.local/bin

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

```

:::

## Other app setup

With Django, and most other web frameworks, migrations need to be executed whenever the app starts. We can create a `start` script that runs all the commands that will be needed to start the app locally. Including:

- pulling the latest images
- building any pending changes in the Dockerfile to an image
- installing dependencies
- starting the container
- running migrations
- attaching logs

Here is a start script that does all of these. This can be placed in the `bin` directory and have a symlink created that points to in the root of the `django` repo.

```bash
#!/bin/bash

docker compose pull
docker compose build

./pip install -r requirements.txt

docker compose up -d

./python python manage.py migrate

docker compose logs -f || docker compose down
```

After running `./start` the migrations should apply, and you should be able to create a superuser and login to the Django admin @ http://localhost/admin

```shell
./python python manage.py createsuperuser
```
