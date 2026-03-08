const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['admin', 'user', 'staff'], default: 'user' },
        status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
    },
    { timestamps: true }
);

// Hash password trước khi save
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    console.log(this.passwordHash);
    // next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log(candidatePassword, this.passwordHash);
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Ẩn passwordHash khi trả về JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
