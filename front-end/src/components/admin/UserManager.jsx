import { useState, useEffect } from 'react';
import { userApi, authApi } from '../../services/api';
import { Trash2, Plus, X, Loader2, UserCog, User, ShieldCheck } from 'lucide-react';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', passwordHash: '', role: 'staff' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userApi.getAll();
            setUsers(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            // Note: Our auth register API acts as user creation here
            await authApi.register(formData);
            setShowForm(false);
            setFormData({ name: '', phone: '', email: '', passwordHash: '', role: 'staff' });
            fetchUsers();
        } catch (err) {
            alert(err.message || 'Lỗi khi tạo tài khoản');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (user) => {
        if (user.role === 'admin') return alert('Không thể xóa admin!');
        if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.name}?`)) return;
        try {
            await userApi.delete(user._id);
            fetchUsers();
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa người dùng');
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E86A12]" size={36} /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-gray-800 text-lg">Quản lý Nhân sự</h2>
                <button
                    onClick={() => {
                        setFormData({ name: '', phone: '', email: '', passwordHash: '', role: 'staff' });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-1.5 bg-[#E86A12] hover:bg-[#d45e0f] text-white text-sm font-bold px-4 py-2 rounded-xl"
                >
                    <Plus size={16} /> Thêm Mới
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                        <tr>
                            <th className="py-3 px-4">Tên nhân viên</th>
                            <th className="py-3 px-4">Liên hệ</th>
                            <th className="py-3 px-4 text-center">Vai trò</th>
                            <th className="py-3 px-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                                    <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {u.role === 'admin' ? <ShieldCheck size={14} /> : <UserCog size={14} />}
                                    </div>
                                    {u.name}
                                </td>
                                <td className="py-3 px-4 text-gray-500 text-xs">
                                    <p>{u.email}</p>
                                    <p>{u.phone}</p>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDelete(u)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex py-10 items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm max-h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
                            <h3 className="font-extrabold text-gray-800">Tạo Tài khoản</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Họ tên *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Email *</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Số điện thoại *</label>
                                <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Mật khẩu *</label>
                                <input required type="text" value={formData.passwordHash} onChange={e => setFormData({ ...formData, passwordHash: e.target.value })} placeholder="VD: 123456" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Vai trò</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12] font-bold">
                                    <option value="staff">Nhân viên phục vụ (Staff)</option>
                                    <option value="admin">Quản lý (Admin)</option>
                                </select>
                            </div>

                            <button type="submit" disabled={actionLoading} className="w-full bg-[#E86A12] hover:bg-[#d45e0f] shadow-md shadow-[#E86A12]/20 text-white rounded-xl py-3.5 font-extrabold flex justify-center gap-2 transition-all">
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Tạo tài khoản'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
