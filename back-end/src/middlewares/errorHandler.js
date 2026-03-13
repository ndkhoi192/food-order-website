// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.stack || err.message);

    // Multer error
    if (err.name === 'MulterError') {
        return res.status(400).json({ success: false, message: err.message });
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    // Duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({ success: false, message: `Giá trị '${field}' đã tồn tại` });
    }
    // Cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server nội bộ',
    });
};

module.exports = errorHandler;
