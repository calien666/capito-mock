# capito Mock Server

## Description

This mock server is currently under development.
Not all features are implemented yet.

Node.js based mock server emulating
the [capito API](https://api.capito.ai/v2/__docs/swagger/).

For information about capito see [https://capito.eu/](https://capito.eu/).

## Usage

```shell
docker image build -t calien666/capito-mock .
docker run -d --rm --name capito-mock -p3000:3000 -p3001:3001 calien666/capito-mock
```

This docker image is provided on github packages:
[Github image](https://ghcr.io/calien666/capito-mock)

## API Endpoints

### Preamble

All API endpoints documented on
the [capito API](https://api.capito.ai/v2/__docs/swagger/) should work as
described there. As this is a mock server for testing, the response is limited.
For correct answers, see captio documentation, as these answers are implemented
as they are in this mock server.

For dealing with authentication, additionally, an auth0 authentication endpoint
is implemented.

All client side HTTP codes are implemented and should return the value as
expected.

### Auth0

| Endpoint       | Method |
|----------------|--------|
| `/oauth/token` | POST   |

#### Generate Token

| Parameter     | Default Value         | Type         |
|---------------|-----------------------|--------------|
| grant_type    | password              | string (fix) |
| username      |                       | string       |
| password      |                       | string       |
| audience      | http://localhost:3000 | string (url) |
| client_id     |                       | string       |
| client_secret |                       | string       |

#### Refresh Token

| Parameter     | Default Value | Type         |
|---------------|---------------|--------------|
| grant_type    | refresh_token | string (fix) |
| refresh_token |               | string       |

#### Answer

| Parameter     | Type            |
|---------------|-----------------|
| access_token  | random string   |
| refresh_token | random string   |
| expires_in    | int (3600)      |
| id_token      | random string   |
| token_type    | string (Bearer) |

#### Limitations

The oauth endpoint allows all values given in the parameters and returns random
created strings for the access token.
The only check is if needed parameters for endpoints are given
and the method is called via POST.

There is no check for a valid password/username/refresh_token.

For more information about Auth0 tokens
visit [auth0.com](https://auth0.com/docs/get-started/authentication-and-authorization-flow/resource-owner-password-flow/call-your-api-using-resource-owner-password-flow#request-tokens)
