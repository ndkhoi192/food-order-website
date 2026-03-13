const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        method: {
            type: String,
            enum: ['cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay'],
            default: 'cash',
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionCode: { type: String, default: '' },
        cashierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
