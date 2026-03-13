const router = require('express').Router();
const {
    getPayments,
    getPaymentById,
    createPayment,
    createPaymentByTable,
    updatePaymentStatus,
    getRevenueSummary,
} = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// router.get('/summary', authorize('admin'), getRevenueSummary);
router.get('/', authorize('admin', 'staff'), getPayments);
// router.get('/:id', authorize('admin', 'staff'), getPaymentById);
router.post('/', authorize('admin', 'staff'), createPayment);
router.post('/by-table', authorize('admin', 'staff'), createPaymentByTable);
// router.patch('/:id/status', authorize('admin'), updatePaymentStatus);

module.exports = router;
