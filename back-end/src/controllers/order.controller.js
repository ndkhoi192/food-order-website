const Order = require('../models/order.model');
const Table = require('../models/table.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');
const socketIO = require('../socket');

// Hàm tính lineTotal cho mỗi item
const calcLineTotal = (basePriceSnapshot, optionsSnapshot, quantity) => {
    const optionsDelta = optionsSnapshot.reduce((sum, o) => sum + (o.priceDelta || 0), 0);
    return (basePriceSnapshot + optionsDelta) * quantity;
};

// GET /api/orders
const getOrders = asyncHandler(async (req, res) => {
    const { status, paymentStatus, tableId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (tableId) filter.tableId = tableId;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('tableId', 'name zone')
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Order.countDocuments(filter),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('tableId', 'name zone')
        .populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, data: order });
});

// GET /api/orders/table/:tableId  — lấy tất cả đơn active (chưa thanh toán) theo bàn
const getActiveOrderByTable = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        tableId: req.params.tableId,
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['completed', 'cancelled'] },
    }).populate('tableId', 'name zone').sort({ placedAt: -1 });
    res.json({ success: true, data: orders });
});

// POST /api/orders — tạo đơn mới hoặc thêm vào đơn đang mở của bàn
const createOrder = asyncHandler(async (req, res) => {
    const { tableId, customer, items, discount } = req.body;

    if (!tableId || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'tableId và items là bắt buộc' });
    }

    // Lấy thông tin bàn
    const table = await Table.findById(tableId);
    if (!table || !table.isActive) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bàn hoặc bàn không hoạt động' });
    }

    // Xây dựng items với snapshot từ DB
    const builtItems = [];
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive) {
            return res.status(400).json({ success: false, message: `Sản phẩm không tồn tại hoặc đã ngừng bán: ${item.productId}` });
        }

        const optionsSnapshot = item.optionsSnapshot || [];
        const lineTotal = calcLineTotal(product.basePrice, optionsSnapshot, item.quantity || 1);

        builtItems.push({
            productId: product._id,
            nameSnapshot: product.name,
            basePriceSnapshot: product.basePrice,
            quantity: item.quantity || 1,
            optionsSnapshot,
            note: item.note || '',
            lineTotal,
            itemStatus: 'pending',
        });
    }

    // Luôn tạo đơn mới — gộp khi thanh toán
    const subTotal = builtItems.reduce((s, i) => s + i.lineTotal, 0);
    const discountAmount = discount?.value || 0;
    const total = subTotal - discountAmount;

    const order = await Order.create({
        tableId,
        tableNameSnapshot: table.name,
        createdBy: req.user?._id || null,
        customer: customer || { name: `Khách ${table.name}`, phone: '' },
        items: builtItems,
        pricing: {
            subTotal,
            discount: { type: discount?.type || 'fixed', value: discount?.value || 0, amount: discountAmount },
            total,
        },
        placedAt: new Date(),
    });

    // Cập nhật trạng thái bàn thành occupied
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

    // Phát event websocket
    try {
        const io = socketIO.getIO();
        io.to('staff').emit('newOrder', order);
        io.to(`table_${tableId}`).emit('updateOrder', order);
    } catch (err) {
        console.error('Socket emit error:', err.message);
    }

    res.status(201).json({ success: true, message: 'Tạo đơn hàng thành công', data: order });
});

// PATCH /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const valid = ['placed', 'preparing', 'served', 'completed', 'cancelled'];
    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: `Status không hợp lệ` });
    }

    const update = { status };
    if (status === 'completed') update.completedAt = new Date();
    if (status === 'cancelled') update.cancelledAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    // Nếu hoàn thành hoặc huỷ => cập nhật bàn về available
    if (status === 'completed' || status === 'cancelled') {
        await Table.findByIdAndUpdate(order.tableId, { status: 'available' });
    }

    // Phat event websocket update order
    try {
        const io = socketIO.getIO();
        io.to('staff').emit('updateOrder', order);
        io.to(`table_${order.tableId}`).emit('updateOrder', order);
    } catch (err) {
        console.error('Socket emit error:', err.message);
    }

    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: order });
});

// PATCH /api/orders/:id/items/:index/status  — cập nhật trạng thái từng item
const updateItemStatus = asyncHandler(async (req, res) => {
    const { itemStatus } = req.body;
    const valid = ['pending', 'preparing', 'served', 'cancelled'];
    if (!valid.includes(itemStatus)) {
        return res.status(400).json({ success: false, message: 'itemStatus không hợp lệ' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const idx = Number(req.params.index);
    if (idx < 0 || idx >= order.items.length) {
        return res.status(400).json({ success: false, message: 'Index item không hợp lệ' });
    }

    order.items[idx].itemStatus = itemStatus;
    await order.save();

    // Phat event websocket update order
    try {
        const io = socketIO.getIO();
        io.to('staff').emit('updateOrder', order);
        io.to(`table_${order.tableId}`).emit('updateOrder', order);
    } catch (err) {
        console.error('Socket emit error:', err.message);
    }
    res.json({ success: true, message: 'Cập nhật trạng thái món thành công', data: order });
});

// DELETE /api/orders/:id  (admin)
const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, message: 'Xoá đơn hàng thành công' });
});

module.exports = {
    getOrders,
    getOrderById,
    getActiveOrderByTable,
    createOrder,
    updateOrderStatus,
    updateItemStatus,
    deleteOrder,
};
