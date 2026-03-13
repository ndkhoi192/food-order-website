const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const Table = require('../models/table.model');
const socketIO = require('../socket');
const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/payments
const getPayments = asyncHandler(async (req, res) => {
    const { status, method, orderId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (orderId) filter.orderId = orderId;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate('orderId', 'code tableNameSnapshot total')
            .populate('cashierId', 'name email')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Payment.countDocuments(filter),
    ]);

    res.json({ success: true, data: payments, total, page: Number(page), limit: Number(limit) });
});

// GET /api/payments/:id
const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate('orderId', 'code tableNameSnapshot pricing')
        .populate('cashierId', 'name email');
    if (!payment) return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    res.json({ success: true, data: payment });
});

// POST /api/payments  — tạo thanh toán cho đơn hàng
const createPayment = asyncHandler(async (req, res) => {
    const { orderId, method, transactionCode } = req.body;

    if (!orderId) return res.status(400).json({ success: false, message: 'orderId là bắt buộc' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    if (order.paymentStatus === 'paid') {
        return res.status(409).json({ success: false, message: 'Đơn hàng đã được thanh toán' });
    }

    const payment = await Payment.create({
        orderId,
        amount: order.pricing.total,
        method: method || 'cash',
        status: 'success',
        transactionCode: transactionCode || '',
        cashierId: req.user._id,
    });

    // Cập nhật paymentStatus của đơn hàng
    order.paymentStatus = 'paid';
    if (order.status !== 'completed') order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    // Nếu không còn đơn unpaid nào tại bàn đó → đặt bàn về trống
    const unpaidRemaining = await Order.countDocuments({
        tableId: order.tableId,
        paymentStatus: 'unpaid',
        status: { $in: ['placed', 'preparing', 'served'] },
    });
    if (unpaidRemaining === 0) {
        await Table.findByIdAndUpdate(order.tableId, { status: 'available' });
        // Thông báo realtime cho staff
        try {
            const io = socketIO.getIO();
            io.to('staff').emit('tableCleared', { tableId: String(order.tableId) });
        } catch (e) { /* socket chưa init */ }
    }

    res.status(201).json({ success: true, message: 'Thanh toán thành công', data: payment });
});

// POST /api/payments/by-table  — thanh toán toàn bộ đơn unpaid của một bàn
const createPaymentByTable = asyncHandler(async (req, res) => {
    const { tableId, method } = req.body;
    if (!tableId) return res.status(400).json({ success: false, message: 'tableId là bắt buộc' });

    const unpaidOrders = await Order.find({
        tableId,
        paymentStatus: 'unpaid',
        status: { $in: ['placed', 'preparing', 'served', 'completed'] },
    });

    if (unpaidOrders.length === 0) {
        return res.status(409).json({ success: false, message: 'Không có đơn hàng chưa thanh toán tại bàn này' });
    }

    const totalAmount = unpaidOrders.reduce((s, o) => s + o.pricing.total, 0);

    const payment = await Payment.create({
        orderId: unpaidOrders[0]._id, // reference đơn đầu tiên
        amount: totalAmount,
        method: method || 'cash',
        status: 'success',
        transactionCode: '',
        cashierId: req.user._id,
    });

    // Đánh dấu tất cả đơn là paid + completed
    await Order.updateMany(
        { _id: { $in: unpaidOrders.map(o => o._id) } },
        { paymentStatus: 'paid', status: 'completed', completedAt: new Date() }
    );

    // Đặt bàn về trống
    await Table.findByIdAndUpdate(tableId, { status: 'available' });

    // Thông báo realtime
    try {
        const io = socketIO.getIO();
        io.to('staff').emit('tableCleared', { tableId: String(tableId) });
    } catch (e) { /* socket chưa init */ }

    res.status(201).json({ success: true, message: 'Thanh toán toàn bàn thành công', data: payment });
});

// PATCH /api/payments/:id/status
const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const valid = ['pending', 'success', 'failed', 'refunded'];
    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status không hợp lệ' });
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });

    // Nếu hoàn tiền thì cập nhật order
    if (status === 'refunded') {
        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'refunded' });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công', data: payment });
});

// GET /api/payments/summary  — thống kê doanh thu (admin)
const getRevenueSummary = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const matchStage = { status: 'success' };
    if (from || to) {
        matchStage.createdAt = {};
        if (from) matchStage.createdAt.$gte = new Date(from);
        if (to) matchStage.createdAt.$lte = new Date(to);
    }

    const result = await Payment.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalTransactions: { $count: {} },
                avgTransaction: { $avg: '$amount' },
            },
        },
    ]);

    const byMethod = await Payment.aggregate([
        { $match: matchStage },
        { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $count: {} } } },
        { $sort: { total: -1 } },
    ]);

    res.json({
        success: true,
        data: {
            summary: result[0] || { totalRevenue: 0, totalTransactions: 0, avgTransaction: 0 },
            byMethod,
        },
    });
});

module.exports = { getPayments, getPaymentById, createPayment, createPaymentByTable, updatePaymentStatus, getRevenueSummary };
