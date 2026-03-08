const Table = require('../models/table.model');
const asyncHandler = require('../middlewares/asyncHandler');
const crypto = require('crypto');

// GET /api/tables
const getTables = asyncHandler(async (req, res) => {
    const { zone, status, isActive } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const tables = await Table.find(filter).sort({ name: 1 });
    res.json({ success: true, data: tables });
});

// GET /api/tables/qr/:token
const getTableByQrToken = asyncHandler(async (req, res) => {
    const table = await Table.findOne({ qrToken: req.params.token, isActive: true });
    if (!table) return res.status(404).json({ success: false, message: 'QR không hợp lệ hoặc bàn không hoạt động' });
    res.json({ success: true, data: table });
});

// POST /api/tables  (admin)
const createTable = asyncHandler(async (req, res) => {
    const { name, zone, capacity, status, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên bàn là bắt buộc' });

    // Tự sinh qrToken
    const qrToken = `TBL-${name.replace(/\s+/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const table = await Table.create({ name, zone, capacity, status, isActive, qrToken });
    res.status(201).json({ success: true, message: 'Tạo bàn thành công', data: table });
});

// PUT /api/tables/:id  (admin)
const updateTable = asyncHandler(async (req, res) => {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    res.json({ success: true, message: 'Cập nhật bàn thành công', data: table });
});

// PATCH /api/tables/:id/status  (admin/staff)
const updateTableStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    res.json({ success: true, message: 'Cập nhật trạng thái bàn thành công', data: table });
});

// DELETE /api/tables/:id  (admin)
const deleteTable = asyncHandler(async (req, res) => {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    res.json({ success: true, message: 'Xoá bàn thành công' });
});

module.exports = { getTables, getTableById, getTableByQrToken, createTable, updateTable, updateTableStatus, deleteTable };
