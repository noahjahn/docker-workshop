# Pre-requisites

> Before diving into some information about Docker and working through some examples of using it in the real world, you'll need to have a few things installed to get up and running. We also assume a few things about your environment. Those will be listed here too.

## Assumptions

1. You have a unix-based operating system. This includes:

   - Linux (specifically Ubuntu, at least for this guide)
   - MacOS
   - Windows Subsystem for Linux (WSL)

   :::info Why Ubuntu?
   Ubuntu supports installing Docker Desktop, which gives you a nice interface for working with Docker containers locally, as well as some nice out-of-the-box defaults for container networking (to be discussed)
   :::

   :::info What's a WSL??
   TODO: Take a look here...
   :::

2. You are comfortable in the terminal and are able to execute commands

3. You have a general understanding of unix filesystems

4. You have the software installed in the [Software to be installed](#software-to-be-installed) section

5. You're eager to learn more about Docker and how it can improve your development workflow, through production

## Software to be installed

- [Docker Desktop](https://docs.docker.com/desktop/)
- Your favorite Text editor - [VSCode](https://code.visualstudio.com/) or [VSCodium](https://vscodium.com/) is recommended

:::tip
There are some nice extensions, like the [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) extension, to interface with Docker right inside of VSCode
:::
