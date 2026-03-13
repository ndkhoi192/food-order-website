const path = require('path');
const fs = require('fs');
const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
    const { categoryId, isActive, search } = req.query;
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 }),
        Product.countDocuments(filter),
    ]);

    res.json({ success: true, data: products, total});
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, data: product });
});

// POST /api/products  (admin)
const createProduct = asyncHandler(async (req, res) => {
    const { categoryId, name, description, basePrice, isActive, optionGroups } = req.body;

    if (!categoryId || !name || basePrice === undefined) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'categoryId, name và basePrice là bắt buộc' });
    }

    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
        imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const parsedGroups = optionGroups
        ? typeof optionGroups === 'string'
            ? JSON.parse(optionGroups)
            : optionGroups
        : [];

    const product = await Product.create({
        categoryId,
        name,
        description,
        basePrice: Number(basePrice),
        imageUrl,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
        optionGroups: parsedGroups,
    });

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: product });
});

// PUT /api/products/:id  (admin)
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, basePrice, categoryId, isActive, optionGroups } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Cập nhật ảnh: nếu có file mới thì xoá ảnh cũ (nếu là local)
    if (req.file) {
        if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../../', product.imageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        product.imageUrl = `/uploads/products/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
        product.imageUrl = req.body.imageUrl;
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
    if (optionGroups !== undefined) {
        product.optionGroups = typeof optionGroups === 'string' ? JSON.parse(optionGroups) : optionGroups;
    }

    await product.save();
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: product });
});

// DELETE /api/products/:id  (admin)
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    // Xoá ảnh local nếu có
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', product.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Xoá sản phẩm thành công' });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
