const Order = require('../order/model');
const Invoice = require('../invoice/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../DeliveryAddress/model');
const OrderItem = require('../order-item/model');
const paymentService = require('../payment/service');

const store = async (req, res, next) => {
    let order;
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

        const address = await DeliveryAddress.findById(delivery_address);
        if (!address) {
            return res.status(404).json({ error: 1, message: 'Alamat pengiriman tidak ditemukan' });
        }

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

        return res.status(201).json({
            ...order.toJSON({ virtuals: true }),
            payment_url: paymentUrl
        });
    } catch (err) {
        if (order?._id) {
            await Promise.all([
                OrderItem.deleteMany({ order: order._id }),
                Invoice.deleteOne({ order: order._id }),
                Order.deleteOne({ _id: order._id })
            ]).catch(() => {});
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
        const filter = { user: req.user._id };
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
