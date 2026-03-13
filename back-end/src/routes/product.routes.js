const router = require('express').Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only — upload.single('image') xử lý multipart/form-data
router.post('/', authenticate, authorize('admin'), upload.single('image'), createProduct);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

module.exports = router;
