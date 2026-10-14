const Order = require('../order/model');
const Invoice = require('../invoice/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../DeliveryAddress/model');
const OrderItem = require('../order-item/model');
const Product = require('../product/model');
const paymentService = require('../payment/service');

class InsufficientStockError extends Error {
    constructor(productName) {
        super(`Stok produk "${productName}" tidak mencukupi`);
        this.name = 'InsufficientStockError';
    }
}

const reserveProductStock = async (items) => {
    const quantitiesByProduct = new Map();

    for (const item of items) {
        const product = item.product;
        if (!product?._id) {
            throw new InsufficientStockError(item.name || 'Produk');
        }

        const quantity = Number(item.qty);
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            const error = new Error('Jumlah produk harus berupa bilangan bulat minimal 1');
            error.name = 'InvalidQuantityError';
            throw error;
        }

        const productId = String(product._id);
        const entry = quantitiesByProduct.get(productId) || {
            productId: product._id,
            productName: product.name || item.name || 'Produk',
            quantity: 0
        };
        entry.quantity += quantity;
        if (!Number.isSafeInteger(entry.quantity)) {
            const error = new Error('Jumlah produk melebihi batas yang diperbolehkan');
            error.name = 'InvalidQuantityError';
            throw error;
        }
        quantitiesByProduct.set(productId, entry);
    }

    const reservations = [];

    try {
        for (const entry of quantitiesByProduct.values()) {
            const product = await Product.findOneAndUpdate(
                {
                    _id: entry.productId,
                    stock: { $gte: entry.quantity }
                },
                { $inc: { stock: -entry.quantity } },
                { new: true }
            );

            if (!product) {
                throw new InsufficientStockError(entry.productName);
            }

            reservations.push(entry);
        }
    } catch (err) {
        await restoreProductStock(reservations);
        throw err;
    }

    return reservations;
};

const restoreProductStock = async (reservations) => {
    for (const reservation of [...reservations].reverse()) {
        await Product.updateOne(
            { _id: reservation.productId },
            { $inc: { stock: reservation.quantity } }
        );
    }
};

const store = async (req, res, next) => {
    let order;
    let stockReservations = [];
    try {
        const {
            delivery_fee = 0,
            delivery_address,
            payment_method = 'cod'
        } = req.body;

        if (!['cod', 'bank_transfer', 'midtrans'].includes(payment_method)) {
            return res.status(400).json({ error: 1, message: 'Metode pembayaran tidak valid' });
        }
        if (payment_method === 'bank_transfer' && !paymentService.bankTransferConfigured) {
            return res.status(503).json({ error: 1, message: 'Rekening transfer belum dikonfigurasi' });
        }
        if (payment_method === 'midtrans' && !paymentService.midtransConfigured) {
            return res.status(503).json({ error: 1, message: 'Midtrans belum dikonfigurasi' });
        }

        const items = await CartItem.find({ user: req.user._id }).populate('product');
        if (!items.length) {
            return res.status(400).json({ error: 1, message: 'Keranjang masih kosong' });
        }

        const address = await DeliveryAddress.findOne({
            _id: delivery_address,
            user: req.user._id
        });
        if (!address) {
            return res.status(404).json({ error: 1, message: 'Alamat pengiriman tidak ditemukan' });
        }

        stockReservations = await reserveProductStock(items);

        order = new Order({
            status: payment_method === 'cod' ? 'processing' : 'waiting_payment',
            payment_method,
            delivery_fee: Number(delivery_fee || 0),
            delivery_address: {
                provinsi: address.provinsi,
                kabupaten: address.kabupaten,
                kecamatan: address.kecamatan,
                kelurahan: address.kelurahan,
                detail: address.detail
            },
            user: req.user._id
        });

        const orderItems = await OrderItem.insertMany(items.map((item) => ({
            name: item.product?.name || item.name,
            qty: Number(item.qty || 0),
            price: Number(item.product?.price || item.price || 0),
            order: order._id,
            product: item.product?._id || item.product
        })));

        order.order_items = orderItems.map((item) => item._id);
        await order.save();

        const invoice = await Invoice.findOne({ order: order._id });
        invoice.payment_method = payment_method;
        invoice.payment_status = payment_method === 'cod' ? 'cod_due' : 'waiting_payment';

        let paymentUrl;
        if (payment_method === 'midtrans') {
            const transaction = await paymentService.createMidtransTransaction(order, invoice, req.user);
            paymentUrl = transaction.redirect_url;
            invoice.payment_url = paymentUrl;
        }

        await invoice.save();
        await CartItem.deleteMany({ user: req.user._id });
        stockReservations = [];

        return res.status(201).json({
            ...order.toJSON({ virtuals: true }),
            payment_url: paymentUrl
        });
    } catch (err) {
        try {
            await restoreProductStock(stockReservations);
        } catch (restoreError) {
            console.error('Failed to restore reserved product stock:', restoreError);
            return next(restoreError);
        }

        if (order?._id) {
            try {
                await Promise.all([
                    OrderItem.deleteMany({ order: order._id }),
                    Invoice.deleteOne({ order: order._id }),
                    Order.deleteOne({ _id: order._id })
                ]);
            } catch (cleanupError) {
                console.error('Failed to clean up incomplete order:', cleanupError);
                return next(cleanupError);
            }
        }

        if (err?.name === 'InsufficientStockError') {
            return res.status(409).json({ error: 1, message: err.message });
        }
        if (err?.name === 'InvalidQuantityError') {
            return res.status(400).json({ error: 1, message: err.message });
        }

        if (err?.name === 'ValidationError') {
            return res.status(400).json({ error: 1, message: err.message, fields: err.errors });
        }
        return next(err);
    }
};

const index = async (req, res, next) => {
    try {
        const { skip = 0, limit = 10 } = req.query;
        const invoiceOrderIds = await Invoice.distinct('order', {
            user: req.user._id,
            order: { $ne: null }
        });
        const filter = invoiceOrderIds.length
            ? {
                $or: [
                    { user: req.user._id },
                    { _id: { $in: invoiceOrderIds } }
                ]
            }
            : { user: req.user._id };
        const [count, orders] = await Promise.all([
            Order.countDocuments(filter),
            Order.find(filter)
                .skip(parseInt(skip, 10))
                .limit(parseInt(limit, 10))
                .populate('order_items')
                .sort({ createdAt: -1 })
        ]);

        return res.json({
            count,
            data: orders.map((order) => order.toJSON({ virtuals: true }))
        });
    } catch (err) {
        return next(err);
    }
};

const adminIndex = async (req, res, next) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        const [count, orders] = await Promise.all([
            Order.countDocuments({}),
            Order.find({})
                .skip(parseInt(skip, 10))
                .limit(parseInt(limit, 10))
                .populate('order_items')
                .populate('user', 'full_name email')
                .sort({ createdAt: -1 })
        ]);
        const invoices = await Invoice.find({ order: { $in: orders.map((order) => order._id) } });
        const invoiceByOrder = new Map(invoices.map((invoice) => [String(invoice.order), invoice]));

        return res.json({
            count,
            data: orders.map((order) => ({
                ...order.toJSON({ virtuals: true }),
                invoice: invoiceByOrder.get(String(order._id)) || null
            }))
        });
    } catch (err) {
        return next(err);
    }
};

const updateAdminStatus = async (req, res, next) => {
    try {
        const allowedStatuses = ['processing', 'in_delivery', 'delivered'];
        const { status } = req.body;
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 1, message: 'Status pesanan tidak valid' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 1, message: 'Pesanan tidak ditemukan' });
        }

        const invoice = await Invoice.findOne({ order: order._id });
        if (order.payment_method !== 'cod' && invoice?.payment_status !== 'paid') {
            return res.status(409).json({ error: 1, message: 'Pesanan baru bisa dikirim setelah pembayaran lunas' });
        }

        const updated = await Order.findByIdAndUpdate(
            order._id,
            { status },
            { new: true, runValidators: true }
        ).populate('order_items').populate('user', 'full_name email');

        return res.json(updated);
    } catch (err) {
        return next(err);
    }
};

const markAdminPaymentPaid = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 1, message: 'Pesanan tidak ditemukan' });
        }
        if (order.payment_method === 'midtrans') {
            return res.status(409).json({ error: 1, message: 'Status Midtrans diperbarui melalui notifikasi pembayaran' });
        }

        const invoice = await Invoice.findOne({ order: order._id });
        if (!invoice) {
            return res.status(404).json({ error: 1, message: 'Invoice tidak ditemukan' });
        }

        invoice.payment_status = 'paid';
        await invoice.save();
        if (order.status === 'waiting_payment') {
            await Order.updateOne({ _id: order._id }, { status: 'processing' });
        }

        return res.json({ order_id: order._id, payment_status: invoice.payment_status });
    } catch (err) {
        return next(err);
    }
};

module.exports = { store, index, adminIndex, updateAdminStatus, markAdminPaymentPaid };
