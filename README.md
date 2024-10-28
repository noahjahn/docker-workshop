# docker-workshop

A guided set of notes and examples for using Docker

Docker workshop repo, guide, and docs compiled for a GR Web Dev event

## Developing locally

```shell
docker run --rm -v ./:/home/bun/app -p 5173:5173 --user $UID -it oven/bun docs:dev
```
