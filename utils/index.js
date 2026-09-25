const { AbilityBuilder, createMongoAbility, subject } = require('@casl/ability');

// function to get token from request header
function getToken(req) {
    const authHeader = req.headers && req.headers.authorization ? req.headers.authorization : null;
    if (!authHeader) return null;

    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    return token && token.length ? token : null;
}

const normalizeResource = (resource, subjectName = 'Resource') => {
    if (!resource) return null;

    if (typeof resource === 'string') {
        return resource;
    }

    const normalized = { ...resource };

    if (!normalized.user_id && normalized.user) {
        normalized.user_id = normalized.user;
    }

    if (normalized.user_id && !normalized.user) {
        normalized.user = normalized.user_id;
    }

    return subject(subjectName, normalized);
};

const definePolicy = (user, can) => {
    const currentUser = user || {};
    const role = currentUser.role || 'guest';

    if (role === 'admin') {
        can('manage', 'all');
        return;
    }

    if (role === 'user') {
        can('view', 'Order');
        can('create', 'Order');
        can('read', 'Order', { user_id: currentUser._id });
        can('update', 'User', { _id: currentUser._id });
        can('read', 'Cart', { user_id: currentUser._id });
        can('update', 'Cart', { user_id: currentUser._id });
        can('view', 'DeliveryAddress');
        can('create', 'DeliveryAddress', { user_id: currentUser._id });
        can('read', 'DeliveryAddress', { user_id: currentUser._id });
        can('update', 'DeliveryAddress', { user_id: currentUser._id });
        can('delete', 'DeliveryAddress', { user_id: currentUser._id });
        can('read', 'Invoice', { user_id: currentUser._id });
        return;
    }

    can('read', 'Product');
    can('view', 'DeliveryAddress');
};

const policyFor = (user = {}) => {
    const builder = new AbilityBuilder(createMongoAbility);
    definePolicy(user, builder.can.bind(builder));
    return builder.build();
};

const policyfor = (user) => policyFor(user);

module.exports = {
    getToken,
    policyfor,
    policyFor,
    definePolicy,
    normalizeResource
};