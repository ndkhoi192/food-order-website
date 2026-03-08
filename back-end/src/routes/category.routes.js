const router = require('express').Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public
router.get('/', getCategories);

// Admin only
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
