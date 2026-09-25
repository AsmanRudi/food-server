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

// policy
const policies = {
    guest(user, { can }) {
        can('read', 'Product');
        can('view', 'DeliveryAddress');
    },

    user(user, { can }) {
        can('view', 'Order');
        can('create', 'Order');
        can('read', 'Order', { user_id: user._id });
        can('update', 'User', { _id: user._id });
        can('read', 'Cart', { user_id: user._id });
        can('update', 'Cart', { user_id: user._id });
        can('view', 'DeliveryAddress');
        can('create', 'DeliveryAddress', { user_id: user._id });
        can('read', 'DeliveryAddress', { user_id: user._id });
        can('update', 'DeliveryAddress', { user_id: user._id });
        can('delete', 'DeliveryAddress', { user_id: user._id });
        can('read', 'Invoice', { user_id: user._id });
    },

    admin(user, { can }) {
        can('manage', 'all');
    }
};

const policyfor = (user) => {
    const builder = new AbilityBuilder(createMongoAbility);
    const role = user && user.role ? user.role : 'guest';
    const selectedPolicy = policies[role] || policies.guest;

    selectedPolicy(user || {}, builder);

    return builder.build();
};

module.exports = {
    getToken,
    policyfor,
    normalizeResource
};