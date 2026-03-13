import { useState, useEffect } from 'react';
import { categoryApi } from '../../services/api';
import { Edit2, Trash2, Plus, X, Loader2 } from 'lucide-react';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ _id: '', name: '', sortOrder: 0, isActive: true });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryApi.getAll();
            setCategories(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (formData._id) {
                await categoryApi.update(formData._id, formData);
            } else {
                await categoryApi.create(formData);
            }
            setShowForm(false);
            setFormData({ _id: '', name: '', sortOrder: 0, isActive: true });
            fetchCategories();
        } catch (err) {
            alert(err.message || 'Lỗi khi lưu danh mục');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
        try {
            await categoryApi.delete(id);
            fetchCategories();
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa danh mục');
        }
    };

    const handleEdit = (cat) => {
        setFormData({ _id: cat._id, name: cat.name, sortOrder: cat.sortOrder, isActive: cat.isActive });
        setShowForm(true);
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E86A12]" size={36} /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-gray-800 text-lg">Quản lý Danh mục</h2>
                <button
                    onClick={() => {
                        setFormData({ _id: '', name: '', sortOrder: 0, isActive: true });
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
                            <th className="py-3 px-4">Tên</th>
                            <th className="py-3 px-4">Thứ tự</th>
                            <th className="py-3 px-4">Trạng thái</th>
                            <th className="py-3 px-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-bold text-gray-800">{cat.name}</td>
                                <td className="py-3 px-4 text-gray-500">{cat.sortOrder}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {cat.isActive ? 'Bật' : 'Tắt'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                                    <button onClick={() => handleEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-extrabold text-gray-800">{formData._id ? 'Sửa' : 'Thêm'} Danh mục</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Tên danh mục *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Thứ tự hiển thị</label>
                                <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: +e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-[#E86A12] border-gray-300 rounded focus:ring-[#E86A12]" />
                                Kích hoạt
                            </label>
                            <button type="submit" disabled={actionLoading} className="w-full bg-[#E86A12] text-white rounded-xl py-3 font-bold flex justify-center gap-2">
                                {actionLoading && <Loader2 size={18} className="animate-spin" />} Lưu lại
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
