import { useState, useEffect } from 'react';
import { productApi, categoryApi, IMAGE_BASE_URL } from '../../services/api';
import { Edit2, Trash2, Plus, X, Loader2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

const EMPTY_OPTION_ITEM = { code: '', label: '', priceDelta: 0, isDefault: false, isActive: true };

const DEFAULT_GROUPS = [
    { type: 'size', name: 'Kích cỡ', required: true, min: 1, max: 1, items: [] },
    { type: 'topping', name: 'Topping', required: false, min: 0, max: 5, items: [] },
    { type: 'sauce', name: 'Loại sốt', required: false, min: 0, max: 3, items: [] },
];

const GROUP_META = {
    size: { icon: '📐', label: 'Kích cỡ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    topping: { icon: '🧀', label: 'Topping', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    sauce: { icon: '🫙', label: 'Loại sốt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=60';

export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        _id: '', name: '', description: '', basePrice: 0, categoryId: '', isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [optionGroups, setOptionGroups] = useState(DEFAULT_GROUPS.map(g => ({ ...g, items: [] })));
    const [expandedGroups, setExpandedGroups] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([productApi.getAll(), categoryApi.getAll()]);
            setProducts(pRes.data || []);
            setCategories(cRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) return alert('Vui lòng chọn danh mục');
        setActionLoading(true);

        const form = new FormData();
        form.append('name', formData.name);
        form.append('description', formData.description);
        form.append('basePrice', formData.basePrice);
        form.append('categoryId', formData.categoryId);
        form.append('isActive', formData.isActive);
        // Only include groups that have items
        const groups = optionGroups.filter(g => g.items.length > 0);
        form.append('optionGroups', JSON.stringify(groups));
        if (imageFile) form.append('image', imageFile);

        try {
            if (formData._id) {
                await productApi.update(formData._id, form);
            } else {
                await productApi.create(form);
            }
            setShowForm(false);
            setFormData({ _id: '', name: '', description: '', basePrice: 0, categoryId: '', isActive: true });
            setImageFile(null);
            setOptionGroups(DEFAULT_GROUPS.map(g => ({ ...g, items: [] })));
            fetchData();
        } catch (err) {
            alert(err.message || 'Lỗi khi lưu sản phẩm');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
            await productApi.delete(id);
            fetchData();
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa sản phẩm');
        }
    };

    const handleEdit = (prod) => {
        setFormData({
            _id: prod._id,
            name: prod.name,
            description: prod.description || '',
            basePrice: prod.basePrice,
            categoryId: prod.categoryId?._id || prod.categoryId || '',
            isActive: prod.isActive
        });
        // Merge existing optionGroups into default structure
        const merged = DEFAULT_GROUPS.map(dg => {
            const existing = (prod.optionGroups || []).find(g => g.type === dg.type);
            return existing ? { ...dg, ...existing } : { ...dg, items: [] };
        });
        setOptionGroups(merged);
        setImageFile(null);
        setShowForm(true);
    };

    // --- Option group helpers ---
    const toggleGroup = (type) => setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

    const addOptionItem = (groupType) => {
        setOptionGroups(prev => prev.map(g =>
            g.type === groupType ? { ...g, items: [...g.items, { ...EMPTY_OPTION_ITEM, code: `${groupType}_${Date.now()}` }] } : g
        ));
    };

    const removeOptionItem = (groupType, idx) => {
        setOptionGroups(prev => prev.map(g =>
            g.type === groupType ? { ...g, items: g.items.filter((_, i) => i !== idx) } : g
        ));
    };

    const updateOptionItem = (groupType, idx, field, value) => {
        setOptionGroups(prev => prev.map(g =>
            g.type === groupType
                ? { ...g, items: g.items.map((it, i) => i === idx ? { ...it, [field]: value } : it) }
                : g
        ));
    };

    const updateGroupField = (groupType, field, value) => {
        setOptionGroups(prev => prev.map(g =>
            g.type === groupType ? { ...g, [field]: value } : g
        ));
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E86A12]" size={36} /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-gray-800 text-lg">Quản lý Sản phẩm</h2>
                <button
                    onClick={() => {
                        setFormData({ _id: '', name: '', description: '', basePrice: '', categoryId: categories[0]?._id || '', isActive: true });
                        setOptionGroups(DEFAULT_GROUPS.map(g => ({ ...g, items: [] })));
                        setImageFile(null);
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
                            <th className="py-3 px-4">Tên món</th>
                            <th className="py-3 px-4">Danh mục</th>
                            <th className="py-3 px-4">Giá bán</th>
                            <th className="py-3 px-4 text-center">Trạng thái</th>
                            <th className="py-3 px-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(prod => {
                            const imgSrc = prod.imageUrl
                                ? (prod.imageUrl.startsWith('http') ? prod.imageUrl : `${IMAGE_BASE_URL}${prod.imageUrl}`)
                                : FALLBACK_IMG;
                            return (
                                <tr key={prod._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={e => e.target.src = FALLBACK_IMG} />
                                            </div>
                                            <span className="font-bold text-gray-800 line-clamp-2">{prod.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500">{prod.categoryId?.name || '---'}</td>
                                    <td className="py-3 px-4 font-extrabold text-[#E86A12]">{Number(prod.basePrice).toLocaleString('vi-VN')}đ</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${prod.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {prod.isActive ? 'Bật' : 'Tắt'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(prod)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(prod._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex py-10 items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white rounded-3xl p-6 w-full max-w-lg max-h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
                            <h3 className="font-extrabold text-gray-800">{formData._id ? 'Sửa' : 'Thêm'} Món ăn</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Tên món *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Giá bán (VNĐ) *</label>
                                    <input type="number" required min="0" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: +e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Danh mục *</label>
                                    <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E86A12]">
                                        <option value="" disabled>-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Mô tả đặc sắc</label>
                                <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#E86A12] resize-none"></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Ảnh đại diện (Tùy chọn)</label>
                                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#fff1e7] file:text-[#E86A12] hover:file:bg-[#fff1e7]" />
                            </div>

                            {/* ===== OPTION GROUPS (Size / Topping / Sauce) ===== */}
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <p className="text-xs font-bold text-gray-500 mb-3">Tuỳ chọn sản phẩm</p>
                                <div className="space-y-3">
                                    {optionGroups.map(group => {
                                        const meta = GROUP_META[group.type] || { icon: '⚙️', label: group.type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
                                        const isOpen = expandedGroups[group.type];
                                        return (
                                            <div key={group.type} className="border border-gray-100 rounded-2xl overflow-hidden">
                                                {/* Group header */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(group.type)}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{meta.icon}</span>
                                                        <span className="font-bold text-sm text-gray-800">{meta.label}</span>
                                                        {group.items.length > 0 && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                                                                {group.items.length} mục
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                </button>

                                                {/* Group body */}
                                                {isOpen && (
                                                    <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                                                        {/* Group settings */}
                                                        <div className="flex items-center gap-4 pt-3">
                                                            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={group.required}
                                                                    onChange={e => updateGroupField(group.type, 'required', e.target.checked)}
                                                                    className="w-3.5 h-3.5 text-[#E86A12] rounded"
                                                                />
                                                                Bắt buộc
                                                            </label>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                                <span>Chọn tối đa</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="10"
                                                                    value={group.max}
                                                                    onChange={e => updateGroupField(group.type, 'max', +e.target.value)}
                                                                    className="w-14 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-[#E86A12]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Items list */}
                                                        {group.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-gray-50/70 rounded-xl p-2.5">
                                                                <input
                                                                    placeholder="Tên (VD: Lớn)"
                                                                    value={item.label}
                                                                    onChange={e => updateOptionItem(group.type, idx, 'label', e.target.value)}
                                                                    className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#E86A12]"
                                                                />
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="+đ"
                                                                        value={item.priceDelta}
                                                                        onChange={e => updateOptionItem(group.type, idx, 'priceDelta', +e.target.value)}
                                                                        className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#E86A12]"
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">đ</span>
                                                                </div>
                                                                <label className="flex items-center gap-1 text-[10px] text-gray-500 font-bold whitespace-nowrap" title="Mặc định">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.isDefault}
                                                                        onChange={e => updateOptionItem(group.type, idx, 'isDefault', e.target.checked)}
                                                                        className="w-3 h-3 text-[#E86A12] rounded"
                                                                    />
                                                                    MĐ
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOptionItem(group.type, idx)}
                                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Add item button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => addOptionItem(group.type)}
                                                            className="flex items-center gap-1 text-xs font-bold text-[#E86A12] hover:bg-[#fff1e7] px-3 py-2 rounded-xl transition-colors"
                                                        >
                                                            <Plus size={14} /> Thêm {meta.label.toLowerCase()}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-[#E86A12] border-gray-300 rounded focus:ring-[#E86A12]" />
                                Kích hoạt kinh doanh
                            </label>
                            <button type="submit" disabled={actionLoading} className="w-full bg-[#E86A12] hover:bg-[#d45e0f] shadow-md shadow-[#E86A12]/20 text-white rounded-xl py-3.5 font-extrabold flex justify-center gap-2 transition-all">
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Lưu sản phẩm'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
