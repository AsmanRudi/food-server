const User = require('../user/model');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');
const {getToken} = require('../../utils');

const register = async (req, res, next) => {
    try {
        const payload = req.body;
        const user = new User({
            full_name: payload.full_name,
            email: payload.email,
            password: payload.password,
            role: 'user'
        });

        await user.save();

        return res.status(201).json({
            _id: user._id,
            customer_id: user.customer_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        return next(err);
    }
};

const localStrategy = async (email, password, done) => {
    try {
        const user = await User
            .findOne({ email })
            .select('-__v -createdAt -updatedAt -token');

        if (!user) return done(null, false);

        if (await bcrypt.compare(password, user.password)) {
            const { password: _, ...userWithoutPassword } = user.toJSON();
            return done(null, userWithoutPassword);
        }

        return done(null, false);
    } catch (err) {
        return done(err, null);
    }
};

const login = (req, res, next) => {
    passport.authenticate('local', { session: false }, function (err, user) {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                error: 1,
                message: 'Email atau password incorect'
            });
        }

        const signed = jwt.sign(user, config.secretKey, { expiresIn: '1h' });

        User.findByIdAndUpdate(user._id, { $push: { token: signed } })
            .then(() => {
                return res.json({
                    message: 'Login berhasil',
                    user,
                    token: signed
                });
            })
            .catch((updateErr) => next(updateErr));
    })(req, res, next);
};

const logout = async (req, res, next) => {
    const token = getToken(req);
    if (!token) {
        return res.json({
            error: 0,
            message: 'Logout Anda Berhasil'
        });
    }

    try {
        const user = await User.findOneAndUpdate(
            { token: { $in: [token] } },
            { $pull: { token } }
        );

        if (!user) {
            return res.json({
                error: 0,
                message: 'Logout Anda Berhasil'
            });
        }

        return res.json({
            error: 0,
            message: 'Logout Berhasil'
        });
    } catch (err) {
        return next(err);
    }
}


const me = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            err: 1,
            message: 'you, are not login or token Expired'
        });
    }
    res.json(req.user);
}


module.exports = {
    register,
    localStrategy,
    login,
    logout,
    me
};
