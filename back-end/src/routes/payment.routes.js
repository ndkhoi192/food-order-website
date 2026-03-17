const router = require('express').Router();
const {
    getPayments,
    createPayment,
    createPaymentByTable,
    getDailyStats,
} = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/daily-stats', authorize('admin', 'staff'), getDailyStats);
router.get('/', authorize('admin', 'staff'), getPayments);
router.post('/', authorize('admin', 'staff'), createPayment);
router.post('/by-table', authorize('admin', 'staff'), createPaymentByTable);

module.exports = router;
