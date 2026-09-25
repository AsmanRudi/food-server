const { getToken, policyFor, normalizeResource } = require('../utils');
const jwt = require('jsonwebtoken');
const config = require('../app/config');
const User = require('../app/user/model');

function decodeToken() {
    return async function (req, res, next) {
        try {
            const token = getToken(req);

            if (!token) return next();

            req.user = jwt.verify(token, config.secretKey);

            let user = await User.findOne({ token: { $in: [token] } });

            if (!user) {
                return res.json({
                    error: 1,
                    message: 'Token Expired'
                });
            }
        } catch (err) {
            if (err && err.name === 'JsonwebTokenError') {
                return res.json({
                    error: 1,
                    message: err.message
                });
            }

            return next(err);
        }

        return next();
    }
}

// middleware untuk cek hak akses
function police_check(action, subjectName, resourceResolver) {
    return async function (req, res, next) {
        try {
            const ability = policyFor(req.user);
            let target = subjectName;

            if (typeof resourceResolver === 'function') {
                const resource = await resourceResolver(req);

                if (resource) {
                    target = normalizeResource(resource, subjectName);
                    req.resource = resource;
                }
            }

            if (!ability.can(action, target)) {
                return res.status(403).json({
                    error: 1,
                    message: `You are not allowed to ${action} ${subjectName}`
                });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
}

module.exports = {
    decodeToken,
    police_check
};