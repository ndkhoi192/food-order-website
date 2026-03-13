const Category = require('../models/category.model');
const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const categories = await Category.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: categories });
});

// POST /api/categories  (admin)
const createCategory = asyncHandler(async (req, res) => {
    const { name, sortOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });

    const category = await Category.create({ name, sortOrder, isActive });
    res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
});

// PUT /api/categories/:id  (admin)
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, message: 'Cập nhật danh mục thành công', data: category });
});

// DELETE /api/categories/:id  (admin)
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, message: 'Xoá danh mục thành công' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
