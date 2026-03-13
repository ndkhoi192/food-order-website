const User = require('../models/user.model');
const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/users  (admin)
const getUsers = asyncHandler(async (req, res) => {
    const { role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
        User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
});

// DELETE /api/users/:id  (admin)
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, message: 'Xoá người dùng thành công' });
});

module.exports = { getUsers, deleteUser };
