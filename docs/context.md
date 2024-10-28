# Docker context

Docker contexts are pretty cool to use as well. I have found that they can be a little confusing, and it's easy to forget that you're using it, but they can help managed servers if you're using Docker on a number of servers. Docker contexts allow you to remotely manage Docker daemons over SSH. For example if you had a server that has a Docker domain running a few containers, and you need to connect to those containers to see logs, you can do so without having to SSH to the machine and access the docker domain that way.

Here, I can create a context that specifies to use the remote server of 192.168.4.2 with the docker-workshop user.

```shell
docker context create docker-workshop --docker "host=ssh://docker-workshop@192.168.4.2"
```

:::info
I'm on a VPN here so the server I'm connecting to is just a private one to the VPN I'm on
:::

Before switching contexts, I can run a `docker ps` to show the containers that I have running, then afterwards run it again to see what is running on the remote docker daemon.

We can also peak at logs of the container running on the server.
