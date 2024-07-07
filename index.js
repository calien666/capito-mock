'use strict';
const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const nocache = require('nocache');

app.use(nocache());

const morgan = require('morgan');
// Logging utility
app.use(morgan('dev')); // Developer-style formatting

const envVarPort = 'CAPITO_MOCK_SERVER_PORT';
const envVarProxyPort = 'CAPITO_MOCK_PROXY_SERVER_PORT';

const port = Number(process.env[envVarPort]);
const proxyPort = Number(process.env[envVarProxyPort]);

if (Number.isNaN(port)) {
    console.error(`The ${envVarPort} environment variable must be defined as the port number.`);
    process.exit(2);
}
if (Number.isNaN(proxyPort)) {
    console.info(`The ${envVarProxyPort} environment variable is not defined, no proxy will be used.`);
}

app.all('/*', (req, res) => {
    res.status(404).send();
});

const server = app.listen(port, () => {
    console.log(`capito API mock-server listening on port ${port}`);
}).on('error', (error) => {
    console.error(`Error occurred while starting the server: ${error}`);
    process.exit(1);
});

server.keepAliveTimeout = 10 * 1000;
