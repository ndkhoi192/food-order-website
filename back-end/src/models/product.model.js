const mongoose = require('mongoose');

const optionItemSchema = new mongoose.Schema(
    {
        code: { type: String, required: true },
        label: { type: String, required: true },
        priceDelta: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { _id: false }
);

const optionGroupSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        name: { type: String, required: true },
        required: { type: Boolean, default: false },
        min: { type: Number, default: 0 },
        max: { type: Number, default: 1 },
        items: [optionItemSchema],
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        basePrice: { type: Number, required: true, min: 0 },
        imageUrl: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        optionGroups: [optionGroupSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
