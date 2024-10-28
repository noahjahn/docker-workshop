FROM python:3

RUN useradd python --create-home --user-group --shell /bin/bash

USER python

# Ensures app, .local, and .cache directories already exist in the image so that we can create volumes to them with the correct permissions
RUN mkdir -p /home/python/app /home/python/.local/bin /home/python/.cache

WORKDIR /home/python/app

# Adds pip binaries to the python user's PATH so we can execute the scripts
ENV PATH=$PATH:/home/python/.local/bin

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
