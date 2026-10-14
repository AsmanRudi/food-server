const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const bcrypt = require('bcrypt');

let userSchema = new Schema({

    full_name: {
        type: String,
        required: [true, 'Nama lengkap harus diisi'],
        maxlength: [255, 'Panjang nama lengkap harus antara 3 - 255 karakter'],
        minlength: [3, 'Panjang nama lengkap harus antara 3 - 255 karakter']
    },

    customer_id: {
        type: Number,

    },

    email: {
        type: String,
        required: [true, 'Email harus diisi'],
        maxlength: [255, 'Panjang email maksimal 255 karakter'],
    },

    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        maxlength: [255, 'Panjang password maksimal 255 karakter'],
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    token: [String],

}, { timestamps: true });

userSchema.path('email').validate(function (value) {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return EMAIL_RE.test(value);
}, attr => `${attr.value} harus merupakan email yang valid!`);

userSchema.path('email').validate(async function (value) {
    try {
        const criteria = { email: value };
        if (this._id) criteria._id = { $ne: this._id };

        const count = await this.model('User').countDocuments(criteria);
        return !count;
    } catch (err) {
        throw err;
    }
}, attr => `${attr.value} sudah terdaftar`);


//FUNTION UNTUK MENGENKRIPSI PASSWORD SAAT MENYIMPAN KE DATABASE, MENGGUNAKAN LIBRARY BCRYPT
const HASH_ROUND = 10;

userSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();
    this.password = require('bcrypt').hashSync(this.password, HASH_ROUND);
    next();
});



//auto increment untuk customer_id
userSchema.plugin(AutoIncrement, { inc_field: 'customer_id' });

module.exports = model('User', userSchema);