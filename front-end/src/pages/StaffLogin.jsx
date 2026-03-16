import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StaffLogin() {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(form);
            const role = res.data?.user?.role;
            if (role === 'admin' || role === 'staff') {
                navigate('/staff/dashboard');
            } else {
                setError('Tài khoản này không có quyền truy cập staff/admin');
            }
        } catch (err) {
            setError(err.message || 'Email hoặc mật khẩu không đúng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }} />

            <div className="relative w-full max-w-sm">
                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors"
                >
                    ← Quay lại trang chọn bàn
                </button>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-7">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#E86A12] to-[#d45e0f] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#E86A12]/30">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <h1 className="text-xl font-extrabold text-white">Đăng nhập Staff</h1>
                        <p className="text-slate-400 text-sm mt-1">Dành cho nhân viên & quản trị viên</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-medium mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="staff@restaurant.com"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#E86A12]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Mật khẩu</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#E86A12]/20 transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#E86A12] hover:bg-[#d45e0f] disabled:opacity-70 text-white py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#E86A12]/30 transition-all active:scale-95 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <> Đăng nhập <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-xs mt-4">
                    Chỉ dành cho nhân viên được cấp phép
                </p>
            </div>
        </div>
    );
}
