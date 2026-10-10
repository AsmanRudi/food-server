const paymentService = require('./service');
const Order = require('../order/model');
const Invoice = require('../invoice/model');

const options = (req, res) => res.json(paymentService.getPaymentOptions());

const notification = async (req, res, next) => {
    try {
        if (!paymentService.snap) {
            return res.status(503).json({ error: 1, message: 'Midtrans belum dikonfigurasi' });
        }

        const result = await paymentService.snap.transaction.notification(req.body);
        const order = await Order.findById(result.order_id);
        const invoice = await Invoice.findOne({ order: result.order_id });

        if (!order || !invoice || invoice.payment_method !== 'midtrans') {
            return res.status(404).json({ error: 1, message: 'Transaksi tidak ditemukan' });
        }

        if (result.transaction_status === 'settlement' ||
            (result.transaction_status === 'capture' && result.fraud_status === 'accept')) {
            invoice.payment_status = 'paid';
            order.status = 'processing';
            await invoice.save();
            await Order.updateOne({ _id: order._id }, { status: 'processing' });
        } else if (['cancel', 'expire', 'deny'].includes(result.transaction_status)) {
            invoice.payment_status = 'failed';
            await invoice.save();
        }

        return res.json({ received: true });
    } catch (error) {
        return next(error);
    }
};

module.exports = { notification, options };