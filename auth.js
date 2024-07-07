'use strict';
// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

const util = require('./util');

const users = new Map();
/*
util.scheduleCleanup(users, (_, authKey) => {
    console.log('Removed user account for:', authKey);
});
*/
function userExists(authKey) {
    return (authKey && authKey !== '' && authKey !== 'invalid' && users.has(authKey));
}

function createUser(authKey, session) {
    const usage = {};
    if (session?.init_char_limit !== 0) {
        usage.character_count = 0;
        usage.character_limit = session?.init_char_limit || 20000000;
    }
    if (session?.init_doc_limit !== 0) {
        usage.document_count = 0;
        usage.document_limit = session?.init_doc_limit || 10000;
    }
    if ((session?.init_team_doc_limit || 0) > 0) {
        usage.team_document_count = 0;
        usage.team_document_limit = session?.init_team_doc_limit;
    }

    console.log('Created user with session:', session, ' authKey:', authKey, ' usage:', usage);
    users.set(authKey, {
        authKey,
        usage,
        used: new Date(),
    });
}

function getAuthKey(request) {
    // Check for Authorization header
    const authorizationHeader = request.headers.authorization;
    if (authorizationHeader !== undefined) {
        const prefixHeaderAuthKey = 'Bearer ';
        if (authorizationHeader.startsWith(prefixHeaderAuthKey)) {
            return authorizationHeader.substring(prefixHeaderAuthKey.length);
        }
        console.log(`Received Authorization header without expected prefix (${prefixHeaderAuthKey}): ${authorizationHeader}`);
        // Note: glossaries endpoints respond 400/{message:"Invalid or missing Authorization header"}
    }
    return undefined;
}

module.exports = (request, response, next) => {
    // Middleware function applied to all incoming requests
    const authKey = getAuthKey(request);

    if (authKey === undefined || authKey === '' || authKey === 'invalid') {
        response.status(403).send();
        return undefined; // Give no response and do not continue with next handler
    }

    if (!userExists(authKey)) {
        createUser(authKey, request.session);
        console.debug(`Added user account for ${authKey}`);
    }
    request.user_account = users.get(authKey);
    request.user_account.used = new Date();
    return next();
};
