'use strict';
const express = require('express');
const httpProxy = require('http-proxy');
const crypto = require('crypto');

const app = express();
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const nocache = require('nocache');

app.use(nocache());

const morgan = require('morgan');
// Logging utility
app.use(morgan('dev')); // Developer-style formatting

const auth = require('./auth');
const util = require('./util');
const {response} = require("express");
const e = require("express");

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

function getParam(request, name, options) {
    let v = request.body[name] || request.query[name];

    if (options?.params) {
        v = request.params[name];
    }

    if (options?.multi) {
        if (v === undefined) v = [];
        v = Array.isArray(v) ? v : [v];
        if (options?.required && v.length === 0) {
            if (options?.newErrorMessage) throw new util.HttpError(`Missing or invalid argument: ${name}'`);
            throw new util.HttpError(`Parameter '${name}' not specified`);
        }
    } else {
        v = Array.isArray(v) ? v[0] : v;
        if (options?.required && v === undefined) {
            if (options?.newErrorMessage) throw new util.HttpError(`Missing or invalid argument: ${name}'`);
            throw new util.HttpError(`Parameter '${name}' not specified`);
        } else if (v === undefined && options?.default !== undefined) {
            return options?.default;
        }

        if (options?.lower && v) v = v.toLowerCase();
        else if (options?.upper && v) v = v.toUpperCase();

        if (options?.validator && options?.validator(v) === false) {
            if (options?.newErrorMessage) throw new util.HttpError(`Missing or invalid argument: ${name}'`);
            throw new util.HttpError(`Value for '${name}' not supported.`);
        }
        if (options?.allowedValues && !options?.allowedValues.includes(v)) {
            if (options?.newErrorMessage) throw new util.HttpError(`Missing or invalid argument: ${name}'`);
            throw new util.HttpError(`Value for '${name}' not supported.`);
        }
    }

    return v;
}

async function handleTranslate(request, response) {
    try {
        // check for required params, if not, answer with Bad request
        getParam(request, 'content');
        getParam(request, 'locale');
        getParam(request, 'proficiency');
    } catch (e) {
        response.status(400).send(e.message);
    }
    const body = {
        content: "This document showcases the incredible features of capitoDigital.\nStarting with the analysis of text to look for issues concerning the text's\naccessibility; and ending with automated simplification based on machine-learning\nand sophisticated algorithms, developed in-house by our own experts in\ncomputer linguistic. Why may one ask? Because this is our goal: Help people\nunderstand!"
    }
    response.status(200).send(body);
}

async function handleAnalyse(request, response) {
    try {
        // check for required params, if not, answer with Bad request
        getParam(request, 'content');
        getParam(request, 'locale');
        getParam(request, 'proficiency');
    } catch (e) {
        response.status(400).send(e.message);
    }
    const body = {
        "issues": [
            {
                "id": "issue-trademark-spelling-summary",
                "metadata": {
                    "category": "vocabulary",
                    "severity": "warning"
                },
                "locations": [
                    {
                        "start": 51,
                        "length": 13
                    }
                ],
                "suggestions": [
                    {
                        "transformations": [
                            {
                                "location": {
                                    "start": 51,
                                    "length": 13
                                },
                                "content": "capito digital"
                            }
                        ],
                        "confidence": "low",
                        "recommended_actions": [
                            "apply-transformations"
                        ],
                        "description": "Incorrect spelling of trademark."
                    }
                ]
            }
        ]
    };
    return response.status(200).send(body);
}

// simplifying the oauth, we add a function faking the oauth step and just return
// an oauth response in case all needed parameters are given
// we don't want to test oauth here, just the capito API
async function generateToken(request, response) {
    try {
        const grantType = getParam(request, 'grant_type');
        if (grantType === 'password') {
            getParam(request, 'username');
            getParam(request, 'password');
            getParam(request, 'audience');
            getParam(request, 'client_secret');
        } else if (grantType === 'refresh_token') {
            getParam(request, 'client_id');
            getParam(request, 'refresh_token');
        } else {
            response.status(406).send('Not acceptable');
        }
    } catch (e) {
        response.status(401).send(e.message);
    }
    const body = {
        access_token: crypto.randomBytes(20).toString('hex'),
        refresh_token: crypto.randomBytes(20).toString('hex'),
        id_token: crypto.randomBytes(20).toString('hex'),
        token_type: 'Bearer',
        expires_in: 3600
    }
    response.status(200).send(body);
}

app.use('/v2/assistance/:account-id/analysis', express.json());
app.put('/v2/assistance/:account-id/analysis', auth, handleAnalyse);
app.use('/v2/translation/:account-id', express.json());
app.put('/v2/translation/:account-id', auth, handleTranslate);
//app.use('/oauth/token', express.json());
app.post('/oauth/token', generateToken);
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

if (!Number.isNaN(proxyPort)) {
    const proxyApp = express();
    const proxy = httpProxy.createProxyServer({});
    proxyApp.all('*', (req, res) => {
        console.log('Proxying request:', req.method, req.url);
        req.headers.forwarded = `for=${req.ip}`;
        proxy.web(req, res, { target: `http://localhost:${port}` }, (err) => {
            console.log('Error while proxying request:', err);
        });
    });
    proxyApp.listen(proxyPort, () => {
        console.log(`capito API mock-proxy-server listening on port ${proxyPort}`);
    });
}
