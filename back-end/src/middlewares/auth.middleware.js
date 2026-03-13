const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Xác thực JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Không có token xác thực' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc tài khoản bị khoá' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
};

// Chỉ cho phép các role nhất định
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu role: ${roles.join(', ')}`,
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
