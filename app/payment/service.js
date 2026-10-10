const midtransClient = require('midtrans-client');
const config = require('../config');

const bankTransferConfigured = Boolean(
    config.bankTransfer.bank &&
    config.bankTransfer.accountName &&
    config.bankTransfer.accountNumber
);

const midtransConfigured = Boolean(
    config.midtrans.serverKey &&
    config.midtrans.clientKey
);

const snap = midtransConfigured
    ? new midtransClient.Snap({
        isProduction: config.midtrans.isProduction,
        serverKey: config.midtrans.serverKey,
        clientKey: config.midtrans.clientKey
    })
    : null;

const getPaymentOptions = () => ({
    cod: { enabled: true },
    bank_transfer: {
        enabled: bankTransferConfigured,
        bank: config.bankTransfer.bank,
        account_name: config.bankTransfer.accountName,
        account_number: config.bankTransfer.accountNumber
    },
    midtrans: { enabled: midtransConfigured }
});

const createMidtransTransaction = (order, invoice, user) => {
    if (!snap) {
        throw new Error('Midtrans belum dikonfigurasi');
    }

    return snap.createTransaction({
        transaction_details: {
            order_id: String(order._id),
            gross_amount: Number(invoice.total)
        },
        customer_details: {
            first_name: user.full_name || 'Pelanggan',
            email: user.email
        }
    });
};

module.exports = {
    bankTransferConfigured,
    createMidtransTransaction,
    getPaymentOptions,
    midtransConfigured,
    snap
};