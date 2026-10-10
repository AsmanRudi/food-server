const Product = require('../product/model');
const CartItem = require('../cart-item/model');

const update = async (req, res, next) => {
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : [];

        const productIds = items
            .map(item => item.product?._id || item.product)
            .filter(Boolean);

        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(product => [String(product._id), product]));

        const cartItems = items.map((item) => {
            const productId = String(item.product?._id || item.product);
            const product = productMap.get(productId);

            if (!product) {
                throw new Error(`Product not found: ${productId}`);
            }

            return {
                product: product._id,
                price: Number(product.price || 0),
                image_url: product.image_url,
                name: product.name,
                user: req.user._id,
                qty: Number(item.qty || 0)
            };
        });

        await CartItem.deleteMany({ user: req.user._id });
        if (!cartItems.length) {
            return res.json([]);
        }
        const inserted = await CartItem.insertMany(cartItems);

        return res.json(inserted);
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

const index = async (req, res, next) => {
    try {
        const items = await CartItem
            .find({ user: req.user._id })
            .populate('product');

        return res.json(items);
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

module.exports = {
    update,
    index
};