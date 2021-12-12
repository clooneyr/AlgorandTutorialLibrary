# Setup Development Environment

There are few ways to setup your development environment:

- Sandbox (Recommended).
- [Third-party API services](https://developer.algorand.org/docs/get-started/devenv/#2-third-party-api-services).
- [Run your Algorand node](https://developer.algorand.org/docs/get-started/devenv/#3-run-your-algorand-node) (Good to do).

---

### _Prerequisites:_

- Docker & docker-compose.

  _It is recommended to run sandbox in Linux-based OS:_

* For Windows, you can [download](https://docs.microsoft.com/en-us/windows/wsl/install) & use WSL2 to run a Ubuntu sub system. ([Full instructions](https://github.com/algorand/sandbox#windows)).
* For MacOS, you can use [Homebrew](https://brew.sh/) to install Docker & docker-compose.

---

## Spin up a local Algorand network with sandbox.

Open a terminal and run:

```
git clone https://github.com/algorand/sandbox.git
```

In whatever local directory the sandbox should reside. Then:

```
cd sandbox
./sandbox up
```

This will run the sandbox shell script with the default configuration. See the Basic Configuration for other options.

Note for Ubuntu: You may need to alias docker to sudo docker or follow the steps in https://docs.docker.com/install/linux/linux-postinstall so that a non-root user can user the command docker.

Run the test command for examples of how to interact with the environment:

```
./sandbox test
```

For more information about configuring the sandbox, see the [sandbox documentation](https://github.com/algorand/sandbox#basic-configuration).
