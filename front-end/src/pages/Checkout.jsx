import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, Edit2, CreditCard, CheckCircle2, TableProperties } from 'lucide-react';
import { orderApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useTable } from '../context/TableContext';

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Tiền mặt', icon: '💵', desc: 'Sẽ có nhân viên ra thanh toán' },
    { id: 'momo', label: 'MoMo / Chuyển khoản', icon: '🟣', desc: 'Thanh toán qua mã QR' },
];

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clearCart } = useCart();
    const { selectedTable } = useTable();

    const { items = [], note = '', subTotal = 0, total = 0 } = location.state || {};

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const saved = sessionStorage.getItem('customerInfo');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.name) setCustomerName(parsed.name);
            if (parsed.phone) setCustomerPhone(parsed.phone);
        }
    }, []);

    if (!selectedTable) {
        return <Navigate to="/" replace />;
    }

    if (items.length === 0 && !success) {
        return <Navigate to="/menu" replace />;
    }

    const handlePlaceOrder = async () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            setError('Vui lòng nhập tên và số điện thoại');
            return;
        }
        setError('');
        setPlacing(true);
        try {
            sessionStorage.setItem('customerInfo', JSON.stringify({ name: customerName, phone: customerPhone }));

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
                customer: { name: customerName, phone: customerPhone },
                items: orderItems,
                note,
                pricing: {
                    subTotal,
                    discount: { type: 'fixed', value: 0, amount: 0 },
                    total,
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

    // Success screen
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 space-y-5 font-['Mulish',sans-serif]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={56} className="text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-[#121212] mb-1">Gửi bếp thành công! 🎉</h2>
                    <p className="text-[#121212]/50 text-sm">Mã đơn: <span className="font-extrabold text-[#E86A12]">{success.code}</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5 w-full max-w-xs text-left space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/50">Bàn phục vụ</span>
                        <span className="font-extrabold text-[#E86A12]">Bàn {selectedTable.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/50">Tổng cộng</span>
                        <span className="font-bold text-[#121212]">{Number(total).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/50">Thanh toán</span>
                        <span className="font-bold text-[#121212]">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full max-w-xs pt-4">
                    <button
                        onClick={() => navigate('/orders')}
                        className="w-full py-3 bg-[#E86A12] text-white rounded-2xl font-extrabold hover:bg-[#d45e0f] transition-colors shadow-md shadow-[#E86A12]/20"
                    >
                        Theo dõi món ăn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-5 pb-8 px-6 py-5 font-['Mulish',sans-serif]">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#f0e6dd] hover:bg-[#FCF8F5]">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-extrabold text-[#121212]">Gửi bếp</h1>
                    <p className="text-xs text-[#121212]/40">Xác nhận đơn hàng của bạn</p>
                </div>
            </div>

            {/* Table Detail */}
            <div className="bg-[#fff1e7] rounded-2xl border border-[#E86A12]/20 p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#E86A12]">
                    <TableProperties size={24} />
                </div>
                <div>
                    <p className="text-xs text-[#E86A12] font-extrabold uppercase tracking-wide mb-0.5">Vị trí phục vụ</p>
                    <p className="text-lg font-extrabold text-[#121212]">
                        Bàn {selectedTable.name}
                    </p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-[#121212] flex items-center gap-2">
                    <Edit2 size={16} className="text-[#E86A12]" /> Thông tin khách hàng
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-[#121212]/50 uppercase tracking-wide mb-1 block">Tên đại diện (để nhân viên gọi) *</label>
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Tên của bạn..."
                            className="w-full bg-[#FCF8F5] border border-[#f0e6dd] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[#121212]/50 uppercase tracking-wide mb-1 block">Số điện thoại *</label>
                        <input
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="SĐT để tích điểm..."
                            type="tel"
                            className="w-full bg-[#FCF8F5] border border-[#f0e6dd] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5">
                <h3 className="font-bold text-[#121212] mb-3 block border-b border-[#f0e6dd]/50 pb-2">Các món đã chọn ({items.length})</h3>
                <div className="space-y-2 mb-3 mt-3">
                    {items.map(item => (
                        <div key={item._key} className="flex justify-between text-sm items-start">
                            <span className="text-[#121212]/60 flex-1 pr-4">
                                <span className="font-extrabold text-[#121212]">{item.quantity}x</span> {item.name}
                            </span>
                            <span className="font-bold text-[#121212]/70 whitespace-nowrap">{Number(item.lineTotal).toLocaleString('vi-VN')}đ</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-dashed border-[#f0e6dd] pt-3 flex justify-between items-center">
                    <span className="font-extrabold text-[#121212] text-lg">Tổng cộng</span>
                    <span className="font-extrabold text-[#E86A12] text-2xl">{Number(total).toLocaleString('vi-VN')}đ</span>
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-[#f0e6dd] shadow-sm p-5">
                <h3 className="font-bold text-[#121212] mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-[#E86A12]" /> Xác nhận thanh toán
                </h3>
                <div className="space-y-2">
                    {PAYMENT_METHODS.map(method => (
                        <label
                            key={method.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id
                                ? 'border-[#E86A12] bg-[#fff1e7]'
                                : 'border-[#f0e6dd] hover:border-[#E86A12]/30'
                                }`}
                        >
                            <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={paymentMethod === method.id}
                                onChange={() => setPaymentMethod(method.id)}
                                className="sr-only"
                            />
                            <span className="text-xl">{method.icon}</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#121212]/70">{method.label}</p>
                                <p className="text-xs text-[#121212]/40">{method.desc}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === method.id ? 'border-[#E86A12] bg-[#E86A12]' : 'border-[#121212]/20'}`}>
                                {paymentMethod === method.id && <div className="w-full h-full rounded-full bg-white scale-50" />}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-bold">
                    {error}
                </div>
            )}

            {/* CTA */}
            <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full bg-[#E86A12] hover:bg-[#d45e0f] disabled:opacity-70 text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E86A12]/20 transition-all active:scale-95"
            >
                {placing ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi bếp...</>
                ) : (
                    <>Gửi bếp — {Number(total).toLocaleString('vi-VN')}đ</>
                )}
            </button>
        </div>
    );
}
