const router = require('express').Router();
const {
    getTables,
    getTableById,
    getTableByQrToken,
    createTable,
    updateTable,
    updateTableStatus,
    deleteTable,
} = require('../controllers/table.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Quét QR thì sẽ kèm link dạng link fe + tables/:token
router.get('/qr/:token', getTableByQrToken);
router.get('/', getTables);

// Staff/Admin
router.post('/', authenticate, authorize('admin'), createTable);
router.put('/:id', authenticate, authorize('admin'), updateTable);
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), updateTableStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteTable);

module.exports = router;
