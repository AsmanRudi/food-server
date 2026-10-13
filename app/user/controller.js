const User = require('./model');

const index = async (req, res, next) => {
    try {
        const users = await User.find()
            .select('_id full_name email role createdAt')
            .sort({ createdAt: -1 });

        return res.json({ data: users });
    } catch (err) {
        return next(err);
    }
};

module.exports = { index };
