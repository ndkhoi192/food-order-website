const router = require('express').Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
