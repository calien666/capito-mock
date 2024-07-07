# capito Mock Server

## Description

This mock server is currently under development.
Not all features are implemented yet.

Node.js based mock server emulating the [capito API](https://api.capito.ai/v2/__docs/swagger/).

For information about capito see [https://capito.eu/](https://capito.eu/).

## Usage

```shell
docker image build -t calien666/capito-mock .
docker run -d --rm --name capito-mock -p3000:3000 -p3001:3001 calien666/capito-mock
```

This docker image is provided on github packages:
[Github image](https://ghcr.io/calien666/capito-mock)
