const mongoose = require('mongoose');

const optionSnapshotSchema = new mongoose.Schema(
    {
        type: String,
        groupName: String,
        label: String,
        priceDelta: { type: Number, default: 0 },
    },
    { _id: false }
);

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        nameSnapshot: String,
        basePriceSnapshot: Number,
        quantity: { type: Number, default: 1, min: 1 },
        optionsSnapshot: [optionSnapshotSchema],
        note: { type: String, default: '' },
        lineTotal: { type: Number, default: 0 },
        itemStatus: {
            type: String,
            enum: ['pending', 'preparing', 'served', 'cancelled'],
            default: 'pending',
        },
    },
    { _id: false }
);

const discountSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
        value: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        code: { type: String, unique: true },
        tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
        tableNameSnapshot: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        customer: {
            name: { type: String, default: 'Khách' },
            phone: { type: String, default: '' },
        },
        status: {
            type: String,
            enum: ['placed', 'preparing', 'served', 'completed', 'cancelled'],
            default: 'placed',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        items: [orderItemSchema],
        pricing: {
            subTotal: { type: Number, default: 0 },
            discount: discountSchema,
            total: { type: Number, default: 0 },
        },
        placedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Tự động sinh mã đơn hàng dạng ORD-YYYYMMDD-XXXX
orderSchema.pre('save', async function () {
    if (!this.code) {
        const now = new Date();
        const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await this.constructor.countDocuments();
        const seq = String(count + 1).padStart(4, '0');
        this.code = `ORD-${datePart}-${seq}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);
