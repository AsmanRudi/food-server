const User = require('./model');

const publicUserFields = '_id customer_id full_name email role createdAt';

const sendValidationError = (res, err) => res.status(400).json({
    error: 1,
    message: err.message,
    fields: err.errors
});

const index = async (req, res, next) => {
    try {
        const users = await User.find()
            .select(publicUserFields)
            .sort({ createdAt: -1 });

        return res.json({ data: users });
    } catch (err) {
        return next(err);
    }
};

const store = async (req, res, next) => {
    try {
        const { full_name, email, password } = req.body;
        const user = new User({
            full_name: typeof full_name === 'string' ? full_name.trim() : full_name,
            email: typeof email === 'string' ? email.trim() : email,
            password,
            role: 'user'
        });

        await user.save();

        return res.status(201).json({
            _id: user._id,
            customer_id: user.customer_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return sendValidationError(res, err);
        }

        if (err && err.code === 11000) {
            return res.status(409).json({
                error: 1,
                message: 'Email sudah terdaftar'
            });
        }

        return next(err);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                error: 1,
                message: 'Role harus berupa user atau admin'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                error: 1,
                message: 'Pengguna tidak ditemukan'
            });
        }

        if (String(user._id) === String(req.user?._id) && role !== user.role) {
            return res.status(403).json({
                error: 1,
                message: 'Role akun admin yang sedang digunakan tidak dapat diubah'
            });
        }

        if (role === user.role) {
            return res.json({
                _id: user._id,
                customer_id: user.customer_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            });
        }

        if (user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });

            if (adminCount <= 1) {
                return res.status(409).json({
                    error: 1,
                    message: 'Role admin terakhir tidak dapat diubah'
                });
            }
        }

        user.role = role;
        if (user.token) user.token = [];
        await user.save();

        return res.json({
            _id: user._id,
            customer_id: user.customer_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return sendValidationError(res, err);
        }

        return next(err);
    }
};

module.exports = { index, store, updateRole };
