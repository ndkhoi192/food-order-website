import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTable } from '../context/TableContext';
import { orderApi, IMAGE_BASE_URL } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60';

export default function Cart() {
    const navigate = useNavigate();
    const { items, updateQty, removeItem, subTotal, clearCart } = useCart();
    const { selectedTable } = useTable();
    const [note, setNote] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    // Success screen
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 space-y-5 font-['Mulish',sans-serif]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={56} className="text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-[#121212] mb-1">Gửi bếp thành công! 🎉</h2>
                    <p className="text-[#121212]/50 text-sm">Mã đơn: <span className="font-extrabold text-[#E86A12]">{success.code}</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5 w-full max-w-xs text-left space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/50">Bàn phục vụ</span>
                        <span className="font-extrabold text-[#E86A12]">Bàn {selectedTable?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/50">Tổng cộng</span>
                        <span className="font-bold text-[#121212]">{Number(success.pricing?.total ?? subTotal).toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full max-w-xs pt-2">
                    <button
                        onClick={() => navigate('/orders')}
                        className="flex-1 py-3 bg-[#E86A12] text-white rounded-2xl font-extrabold hover:bg-[#d45e0f] transition-colors shadow-md shadow-[#E86A12]/20"
                    >
                        Theo dõi đơn
                    </button>
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex-1 py-3 bg-white border border-[#f0e6dd] text-[#121212]/60 rounded-2xl font-extrabold hover:bg-[#FCF8F5] transition-colors"
                    >
                        Gọi thêm
                    </button>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-4 font-['Mulish',sans-serif]">
                <div className="w-28 h-28 bg-[#fff1e7] rounded-full flex items-center justify-center mb-2">
                    <ShoppingBag size={52} className="text-[#E86A12]/40" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#121212]">Giỏ hàng trống</h2>
                <p className="text-[#121212]/40 text-sm max-w-xs">Hãy thêm những món ăn ngon vào giỏ hàng của bạn!</p>
                <button
                    onClick={() => navigate('/menu')}
                    className="mt-2 bg-[#E86A12] text-white px-8 py-3 rounded-2xl font-extrabold shadow-lg shadow-[#E86A12]/20 hover:bg-[#d45e0f] transition-all flex items-center gap-2"
                >
                    <UtensilsCrossed size={18} /> Xem thực đơn
                </button>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        if (!selectedTable) return;
        setError('');
        setPlacing(true);
        try {
            const orderItems = items.map(it => ({
                productId: it.productId,
                nameSnapshot: it.name,
                basePriceSnapshot: it.basePrice,
                quantity: it.quantity,
                optionsSnapshot: it.options || [],
                note: '',
                lineTotal: it.lineTotal,
            }));
            const res = await orderApi.create({
                tableId: selectedTable._id,
                customer: { name: 'Khách', phone: '' },
                items: orderItems,
                note,
                pricing: {
                    subTotal,
                    discount: { type: 'fixed', value: 0, amount: 0 },
                    total: subTotal,
                },
            });
            clearCart();
            setSuccess(res.data);
        } catch (e) {
            setError(e.message || 'Không thể đặt hàng. Thử lại sau.');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 px-6 py-5 font-['Mulish',sans-serif]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#f0e6dd] hover:bg-[#FCF8F5] transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-[#121212]">Giỏ hàng</h1>
                        <p className="text-[#121212]/40 text-sm">{items.length} món đã chọn</p>
                    </div>
                </div>
                <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={14} /> Xóa tất cả
                </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
                {items.map(item => {
                    const imgSrc = item.imageUrl
                        ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL}${item.imageUrl}`)
                        : FALLBACK;
                    return (
                        <div key={item._key} className="flex gap-3 p-3 bg-white rounded-2xl border border-[#f0e6dd] shadow-sm hover:shadow-md transition-shadow">
                            {/* Image */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#fff1e7]">
                                <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" onError={e => e.target.src = FALLBACK} />
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <h3 className="font-bold text-[#121212] text-sm line-clamp-1">{item.name}</h3>
                                    {item.options?.length > 0 && (
                                        <p className="text-xs text-[#121212]/40 line-clamp-1 mt-0.5">
                                            {item.options.map(o => o.label).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-extrabold text-[#E86A12] text-base">
                                        {Number(item.lineTotal).toLocaleString('vi-VN')}đ
                                    </span>
                                    <div className="flex items-center gap-2 bg-[#FCF8F5] rounded-xl px-2 py-1">
                                        <button
                                            onClick={() => updateQty(item._key, item.quantity - 1)}
                                            className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#E86A12] transition-colors"
                                        >
                                            <Minus size={12} strokeWidth={3} />
                                        </button>
                                        <span className="text-sm font-extrabold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQty(item._key, item.quantity + 1)}
                                            className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#E86A12] transition-colors"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Remove */}
                            <button
                                onClick={() => removeItem(item._key)}
                                className="flex-shrink-0 p-1.5 text-[#121212]/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Note */}
            <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-4">
                <label className="text-sm font-bold text-[#121212]/70 mb-2 block">Ghi chú đơn hàng</label>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="VD: Ít đường, không hành..."
                    rows={2}
                    className="w-full text-sm text-[#121212]/60 placeholder:text-[#121212]/30 resize-none focus:outline-none bg-[#FCF8F5] rounded-xl p-3"
                />
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5 space-y-3">
                <h3 className="font-extrabold text-[#121212] text-base mb-3">Tóm tắt đơn hàng</h3>
                <div className="flex justify-between text-sm text-[#121212]/50">
                    <span>Tạm tính</span>
                    <span className="font-bold text-[#121212]/70">{Number(subTotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="border-t border-dashed border-[#f0e6dd] pt-3 flex justify-between items-center">
                    <span className="font-extrabold text-[#121212] text-base">Tổng cộng</span>
                    <span className="font-extrabold text-[#E86A12] text-xl">{Number(subTotal).toLocaleString('vi-VN')}đ</span>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-bold">
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="w-full mt-2 bg-[#E86A12] hover:bg-[#d45e0f] disabled:opacity-70 text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E86A12]/20 transition-all active:scale-95"
                >
                    {placing ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi bếp...</>
                    ) : (
                        <>Đặt hàng →</>
                    )}
                </button>
            </div>
        </div>
    );
}
