const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const productSchema = new Schema({

    name: {
        type: String,
        minlength: [3, 'Panjang nama produk minimal 3 karakter'],
        required: [true, 'Nama produk harus diisi']
    },

    description: {
        type: String,
        maxlength: [1000, 'Panjang deskripsi produk maksimal 1000 karakter'],
    },

    price: {
        type: Number,
        default: 0,
    },

    image_url: String,

    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, ' Category Harus diisi'],
        default: null
    },

    tags: {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
    }

    
}, { timestamps: true });

module.exports = model('Product', productSchema);
