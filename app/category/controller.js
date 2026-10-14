const Category = require('./model');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const store = async (req, res, next) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const existingCategory = await Category.findOne({
            name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
        });

        if (existingCategory) {
            return res.status(409).json({
                error: 1,
                message: 'Kategori dengan nama tersebut sudah ada'
            });
        }

        let category = new Category({ name });
        await category.save();
        return res.status(201).json(category);
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        next(err);
    }
}

const update = async (req, res, next) => {
    try {
        let payload = req.body;
        let category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({
                error: 1,
                message: 'Kategori tidak ditemukan'
            });
        }
        return res.json(category);
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        next(err);
    }
}

const destroy = async (req, res, next) => {
    try {
        let category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({
                error: 1,
                message: 'Kategori tidak ditemukan'
            });
        }
        return res.json(category);
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        next(err);
    }
}


const index = async (req, res, next) => {
    try {
        let category = await Category.find();
        return res.json(category);
    } catch (err) {
        return next(err);
    }   
}


module.exports = {
    store,
    update,
    destroy,
    index
}