const { subject } = require('@casl/ability');
const Invoice = require('./model');
const Order = require('../order/model');
const { policyfor } = require('../../utils');

const show = async (req, res, next) => {
    try {
        const invoice = await Invoice
            .findOne({ order: req.params.order_id })
            .populate('order')
            .populate('user', '_id customer_id full_name email role createdAt');

        if (!invoice) {
            return res.status(404).json({ error: 1, message: 'Invoice not found' });
        }

        const ability = policyfor(req.user || {});
        const invoiceSubject = subject('Invoice', { user_id: invoice.user?._id || invoice.user });

        if (!ability.can('read', invoiceSubject)) {
            return res.status(403).json({
                error: 1,
                message: 'Anda tidak memiliki akses untuk melihat invoice ini.'
            });
        }

        return res.json(invoice);
    } catch (err) {
        return next(err);
    }
};

const pendingTransfers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const filter = {
            payment_method: 'bank_transfer',
            payment_status: 'waiting_payment'
        };
        const [count, invoices] = await Promise.all([
            Invoice.countDocuments(filter),
            Invoice.find(filter)
                .populate('order')
                .populate('user', '_id customer_id full_name email role createdAt')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        return res.json({ data: invoices, count, page, limit });
    } catch (err) {
        return next(err);
    }
};

const confirmTransfer = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({ order: req.params.order_id });

        if (!invoice || invoice.payment_method !== 'bank_transfer') {
            return res.status(404).json({ error: 1, message: 'Transfer tidak ditemukan' });
        }

        invoice.payment_status = 'paid';
        await invoice.save();
        await Order.updateOne({ _id: invoice.order }, { status: 'processing' });

        return res.json(invoice);
    } catch (err) {
        return next(err);
    }
};

module.exports = { show, pendingTransfers, confirmTransfer };