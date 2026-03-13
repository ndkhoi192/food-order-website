const router = require('express').Router();
const {
    getOrders,
    getOrderById,
    getActiveOrderByTable,
    createOrder,
    updateOrderStatus,
    updateItemStatus,
    deleteOrder,
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Lấy đơn active theo bàn (có thể public hoặc require auth tuỳ thiết kế)
router.get('/table/:tableId/active', getActiveOrderByTable);

router.get('/', authenticate, authorize('admin', 'staff'), getOrders);
// router.get('/:id', authenticate, getOrderById);
router.post('/', createOrder); // Public: khách tự đặt qua QR
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), updateOrderStatus);
router.patch('/:id/items/:index/status', authenticate, authorize('admin', 'staff'), updateItemStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteOrder);

module.exports = router;
