const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const asyncHandler = require('../middlewares/asyncHandler');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
    const { name, phone, email, passwordHash, role } = req.body;

    if (!name || !phone || !email || !passwordHash) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email hoặc số điện thoại đã được sử dụng' });
    }

    const user = await User.create({
        name,
        phone,
        email,
        passwordHash: passwordHash,
        role: role || 'user',
    });

    res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: { user, token: generateToken(user._id) },
    });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: { user, token: generateToken(user._id) },
    });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
    res.json({ success: true, data: req.user });
});

module.exports = { register, login, getMe };
