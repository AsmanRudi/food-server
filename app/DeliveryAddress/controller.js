const DeliveryAddress = require('./model');

const store = async (req, res, next) => {
    try {
        let payload = req.body;
        let user = req.user;
        let address = new DeliveryAddress({ ...payload, user: user._id });
        await address.save();
        return res.json(address);
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        return next(err);
    }
};

const update = async (req, res, next) => {
    try {
        let { _id, ...payload } = req.body;
        let { id } = req.params;

        let address = await DeliveryAddress.findByIdAndUpdate(id, payload, { new: true });
        return res.json(address);
    } catch (err) {
        if (err && err.name == 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        return next(err);
    }
};

const destroy = async (req, res, next) => {
    try {
        let { id } = req.params;
        let address = await DeliveryAddress.findByIdAndDelete(id);
        return res.json(address);
    } catch (err) {
        if (err && err.name == 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        return next(err);
    }
};

const index = async (req, res, next) => {
    try {
        let { skip = 0, limit = 10 } = req.query;
        let count = await DeliveryAddress.find({ user: req.user._id }).countDocuments();
        let addresses = await DeliveryAddress
            .find({ user: req.user._id })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort('-create');

        return res.json({ data: addresses, count });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        return next(err);
    }
};

module.exports = {
    store,
    update,
    destroy,
    index
};

