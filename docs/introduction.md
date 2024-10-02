# Docker workshop

Welcome to the beginning of the Docker workshop! These docs are meant to help guide you through learning some topics around Docker, to help you become more comfortable using, troubleshooting, and creating cool things with Docker containers.

> This workshop is originally created for the Docker Workshop GR Web Dev event on October 28th, 2024.

::: info
These docs were built using Vitepress and are hosted on GitHub Pages. The notes, examples, guides, and all of this content is available online publicly @ https://docker-workshop.noahjahn.dev
:::

::: warning Prerequisites!
If you haven't already, check-out the [prerequisites](/prerequisites) before continuing on
:::

## Who am I?

My name is Noah, I'm a DevOps Engineer working at a local software development agency. I was introduced to Docker not long after beginning my software development career and have been intrigued by it ever since. Immediately after using it for some local development for a Craft CMS site, I saw how useful it was. Now, I'm in charge of planning and setting up infrastructure for all the projects we work on at my day job, and there isn't a single day that goes by where I don't find myself using Docker in some way.

## Who is this workshop meant for?

Developers who have used Docker before but maybe...

- want to learn how to write or optimize Dockerfiles
- want to understand how Docker is used locally as well as in production
- want to be able to troubleshoot Docker containers
- want to learn new approaches to using Docker

## Who is this workshop _not_ meant for?

- First-time/beginner Developers
- Developers who don't know what Docker is

:::info
If you feel like you fall under this category, please stick around and soak up as much of this workshop as you can!
:::

## Introduction

This workshop will dive into a few different topics about Docker. It will provide you with real world examples that you can take to any of your projects that you're currently working on and give you insights into how I use Docker myself. The goal here is to give you more tools, ideas, and approaches to Docker to become an advanced user.

If you've used Docker before, you may have been given a project to spin up locally using Docker, probably with a `docker-compose.yml` file and were just told to run `docker compose up`. This workshop is going to help you understand more about that `docker-compose.yml` file, how it was crafted, why there are different services in place, and give you different ways to work with the services defined for the project.

:::warning
Some of my approaches to using Docker are opinionated, but I've found they work pretty well with different groups of developers.
:::

The structure of this workshop is outlined in the side navigation menu. Each topic is going to build on each other, until we get to the examples where we'll combine different concepts to Dockerize a few different projects.

:::warning
I really like using these little tool-tip box things, so there will probably be a lot of them.
:::

## How do I use Docker?

Docker is one of the few development tools that I install on my computer to begin any sort of development. I'm of the mindset where I don't want to install a bunch of different tools, languages, run-times, and dependencies to run a specific project. Sure, there are plenty of tools out there to make these things easier and of course not everything can be run in a container, but using Docker first ends helps me not have to worry about dealing with very specific dependencies for certain projects.

A few examples of this:

- I don't install Node.js
- I don't install Python
- I don't install MySQL
- I don't install PostgreSQL
- I don't install web servers

All of these can be run in a Docker container. And the best thing yet is the project that might require these different tools can define specific versions that might be required _in code_ that can be checked into version control.

## What are some benefits of using Docker?

- Project build-time and run-time dependencies can be defined in code
- Reproducibility and portability - No more (or at least less of) "but, it works on my machine"
- Scalability

All of these benefits increase developer productivity. Less time is wasted setting up project or trying to reproduce what typically might be an environment specific bug.

## Resources

### What is containerization?

- From Docker: https://www.docker.com/resources/what-container/
- From IBM: https://www.ibm.com/topics/containerization

### What is Docker?

https://docs.docker.com/get-started/docker-overview/
