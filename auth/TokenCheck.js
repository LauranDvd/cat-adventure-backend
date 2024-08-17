var express = require('express');
var jwt = require('jsonwebtoken');
const fs = require('fs');
const { startUserRepository } = require('../repository/UserRepository');

const { isUserAdminOrManager, isUserAdmin } = startUserRepository();

const checkTokenThenExecute = (req, res, toBeExecuted) => {
    let authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is missing' });
    }
    let token = authHeader.split(' ')[1];

    var certificate = fs.readFileSync('routes/key.pem'); // TODO move the key

    jwt.verify(token, certificate, { algorithms: ['RS256'] }, async function (err, decoded) {
        console.log('error: ' + err);

        if (decoded === undefined || decoded.sub.substring(0, 6) !== "auth0|") {
            console.log('bad token...');

            return res.status(401).json({ error: `Bad token!!` });
        } else {
            return toBeExecuted(decoded);
        }
    });
}

const checkManagerOrAdminTokenThenExecute = (req, res, toBeExecuted) => {
    checkTokenThenExecute(req, res, async function (decoded) {
        if (await isUserAdminOrManager(decoded.sub.substring(6, decoded.sub.length)) === true) {
            return toBeExecuted(decoded);
        } else {
            return res.status(401).json({ error: `Only managers and admins can do this` });
        }
    })
}

const checkAdminTokenThenExecute = (req, res, toBeExecuted) => {
    checkTokenThenExecute(req, res, async function (decoded) {
        if (await isUserAdmin(decoded.sub.substring(6, decoded.sub.length)) === true) {
            return toBeExecuted(decoded);
        } else {
            return res.status(401).json({ error: `Only admins can do this` });
        }
    })
}


module.exports = { checkTokenThenExecute: checkTokenThenExecute, checkManagerOrAdminTokenThenExecute: checkManagerOrAdminTokenThenExecute, checkAdminTokenThenExecute: checkAdminTokenThenExecute };