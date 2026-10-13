const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');
const {
    deleteProductImage,
    removeTemporaryUpload,
    uploadProductImage
} = require('./image-storage');

const resolveReferences = async (input) => {
    let payload = { ...input };

    if (payload.category) {
        const category = await Category.findOne({
            name: { $regex: payload.category, $options: 'i' }
        });
        if (category) {
            payload.category = category._id;
        } else {
            delete payload.category;
        }
    }

    if (payload.tags && payload.tags.length > 0) {
        const tagNames = Array.isArray(payload.tags) ? payload.tags : [payload.tags];
        const tags = await Tag.find({ name: { $in: tagNames } });
        if (tags.length) {
            payload.tags = tags.map((tag) => tag._id);
        } else {
            delete payload.tags;
        }
    }

    return payload;
};

const store = async (req, res, next) => {
    let imageUrl;

    try {
        const payload = await resolveReferences(req.body);
        if (req.file) imageUrl = await uploadProductImage(req.file);

        let product;
        try {
            product = new Product({
                ...payload,
                ...(imageUrl ? { image_url: imageUrl } : {})
            });
            await product.save();
        } catch (err) {
            if (imageUrl) await deleteProductImage(imageUrl);
            throw err;
        }

        return res.json(product);
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
    let imageUrl;

    try {
        const payload = await resolveReferences(req.body);
        const existingProduct = await Product.findById(req.params.id);

        if (!existingProduct) {
            if (req.file) await removeTemporaryUpload(req.file.path);
            return res.status(404).json({
                error: 1,
                message: 'Product tidak ditemukan'
            });
        }

        if (req.file) imageUrl = await uploadProductImage(req.file);

        let product;
        try {
            product = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    ...payload,
                    ...(imageUrl ? { image_url: imageUrl } : {})
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (err) {
            if (imageUrl) await deleteProductImage(imageUrl);
            throw err;
        }

        if (!product) {
            if (imageUrl) await deleteProductImage(imageUrl);
            return res.status(404).json({
                error: 1,
                message: 'Product tidak ditemukan'
            });
        }

        if (imageUrl && existingProduct.image_url) {
            await deleteProductImage(existingProduct.image_url);
        }

        return res.json(product);
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

const index = async (req, res, next) => {
    try {
        const { skip = 0, limit = 10, q = '', category = '', tags = [] } = req.query;
        let criteria = {};

        if (q.length) {
            criteria = {
                ...criteria,
                name: { $regex: q, $options: 'i' }
            };
        }

        if (category.length) {
            const categoryResult = await Category.findOne({
                name: { $regex: category, $options: 'i' }
            });

            if (categoryResult) {
                criteria = { ...criteria, category: categoryResult._id };
            }
        }

        if (tags.length) {
            const tagsResult = await Tag.find({ name: { $in: tags } });

            if (tagsResult.length > 0) {
                criteria = {
                    ...criteria,
                    tags: { $in: tagsResult.map((tag) => tag._id) }
                };
            }
        }

        const count = await Product.countDocuments(criteria);
        const products = await Product.find(criteria)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('category')
            .populate('tags');

        return res.json({
            data: products,
            count
        });
    } catch (err) {
        return next(err);
    }
};

const destroy = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                error: 1,
                message: 'Product tidak ditemukan'
            });
        }

        await deleteProductImage(product.image_url);
        await Product.findByIdAndDelete(req.params.id);

        return res.json({
            message: 'Produk berhasil dihapus',
            data: product
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    store,
    index,
    update,
    destroy
};
