const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        zone: { type: String, default: '' },
        capacity: { type: Number, default: 4 },
        status: {
            type: String,
            enum: ['available', 'occupied', 'reserved', 'cleaning'],
            default: 'available',
        },
        qrToken: { type: String, unique: true, sparse: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
