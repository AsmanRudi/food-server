const mongoose = require('mongoose');
const { model, Schema } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Invoice = require('../invoice/model');
const OrderItem = require('../order-item/model');

const orderSchema = new Schema({
    status: {
        type: String,
        enum: ['waiting_payment', 'processing', 'in_delivery', 'delivered'],
        default: 'waiting_payment'
    },

    delivery_fee: {
        type: Number,
        default: 0
    },

    delivery_address: {
        provinsi: { type: String, required: [true, 'provinsi harus diisi'] },
        kabupaten: { type: String, required: [true, 'kabupaten harus diisi'] },
        kecamatan: { type: String, required: [true, 'kecamatan harus diisi'] },
        kelurahan: { type: String, required: [true, 'kelurahan harus diisi'] },
        detail: { type: String }
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    order_items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }]
}, { timestamps: true });

orderSchema.plugin(AutoIncrement, { inc_field: 'order_number' });

orderSchema.virtual('items_count').get(function() {
    if (!Array.isArray(this.order_items)) return 0;
    return this.order_items.reduce((total, item) => total + (Number(item?.qty) || 0), 0);
});

orderSchema.post('save', async function() {
    const items = await OrderItem.find({ _id: { $in: this.order_items } });
    const sub_total = items.reduce((total, item) => total + (Number(item.price) * Number(item.qty)), 0);

    const invoice = new Invoice({
        user: this.user,
        order: this._id,
        sub_total,
        delivery_fee: Number(this.delivery_fee || 0),
        total: Number(sub_total + (this.delivery_fee || 0)),
        delivery_address: this.delivery_address
    });

    await invoice.save();
});

module.exports = model('Order', orderSchema);
