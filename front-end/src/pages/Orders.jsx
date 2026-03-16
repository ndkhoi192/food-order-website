import { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowRight, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useTable } from '../context/TableContext';
import { socket } from '../services/socket';

const STATUS_CONFIG = {
    placed: { label: 'Đã gửi bếp', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Package },
    preparing: { label: 'Đang chuẩn bị', color: 'text-[#E86A12] bg-[#fff1e7] border-[#E86A12]/20', icon: Clock },
    served: { label: 'Đã phục vụ', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
    completed: { label: 'Hoàn thành', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
    cancelled: { label: 'Đã hủy', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
};

function OrderCard({ order, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
    const Icon = cfg.icon;

    return (
        <div className="bg-white rounded-3xl border border-[#f0e6dd] shadow-xl overflow-hidden">
            {/* Header row - always visible */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full p-5 border-b border-[#f0e6dd] bg-[#FCF8F5]/50 flex items-center justify-between text-left"
            >
                <div>
                    <p className="text-xs font-extrabold text-[#121212]/30 uppercase tracking-wide mb-1">Mã đơn hàng</p>
                    <p className="font-extrabold text-[#121212] text-lg">{order.code}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-extrabold ${cfg.color}`}>
                        <Icon size={16} />
                        {cfg.label}
                    </div>
                    {open ? <ChevronUp size={18} className="text-[#121212]/40" /> : <ChevronDown size={18} className="text-[#121212]/40" />}
                </div>
            </button>

            {open && (
                <>
                    {/* Status message */}
                    <div className="px-5 pt-4">
                        <div className="bg-white rounded-xl p-3 flex items-start gap-3 border border-[#f0e6dd] shadow-sm">
                            <div className="w-10 h-10 bg-[#fff1e7] text-[#E86A12] rounded-xl flex items-center justify-center flex-shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-[#121212]">Tình trạng</p>
                                <p className="text-xs text-[#121212]/50 leading-relaxed mt-0.5">
                                    {order.status === 'placed' && 'Nhà bếp đã nhận order và đang phân bổ.'}
                                    {order.status === 'preparing' && 'Các đầu bếp đang tận tâm chuẩn bị món của bạn. Sắp xong rồi!'}
                                    {order.status === 'served' && 'Chúc quý khách ngon miệng!'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-5 space-y-4">
                        <p className="text-xs font-extrabold text-[#121212]/30 uppercase tracking-wide">Danh sách món ăn</p>
                        <div className="space-y-3">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex flex-col pb-3 border-b border-[#f0e6dd]/50 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start text-sm">
                                        <span className="text-[#121212]/70 flex-1 pr-4">
                                            <span className="font-extrabold text-[#121212] bg-[#FCF8F5] px-1.5 py-0.5 rounded-md text-xs mr-2">{item.quantity}x</span>
                                            {item.nameSnapshot}
                                        </span>
                                        <span className="font-bold text-[#121212] whitespace-nowrap">
                                            {Number(item.lineTotal).toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                    {item.optionsSnapshot?.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1 ml-8">
                                            {item.optionsSnapshot.map((opt, j) => (
                                                <span key={j} className="text-[10px] bg-[#fff1e7] text-[#d45e0f] font-bold px-2 py-0.5 rounded-md">
                                                    {opt.label}{opt.priceDelta > 0 ? ` +${opt.priceDelta.toLocaleString('vi-VN')}đ` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {item.note && (
                                        <p className="mt-1 text-[10px] text-[#121212]/40 ml-8">📌 {item.note}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-[#FCF8F5]/50 p-5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-extrabold text-[#121212]/30 uppercase tracking-wide mb-1">Tổng cộng</p>
                                <p className="font-extrabold text-[#E86A12] text-2xl">
                                    {Number(order.pricing?.total || 0).toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                            <div className="text-right">
                                {order.paymentStatus === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                                        <CheckCircle size={14} /> Đã thanh toán
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                                        <AlertCircle size={14} /> Chưa thanh toán
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function Orders() {
    const navigate = useNavigate();
    const { selectedTable } = useTable();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(() => {
        if (!selectedTable) return;
        setLoading(true);
        orderApi.getActiveByTable(selectedTable._id)
            .then(res => setOrders(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [selectedTable]);

    useEffect(() => {
        fetchOrders();

        if (!selectedTable) return;

        socket.connect();
        socket.emit('joinTableRoom', selectedTable._id);

        socket.on('newOrder', fetchOrders);
        socket.on('updateOrder', fetchOrders);

        return () => {
            socket.off('newOrder', fetchOrders);
            socket.off('updateOrder', fetchOrders);
            socket.disconnect();
        };
    }, [fetchOrders, selectedTable]);

    if (!selectedTable) {
        return <Navigate to="/" replace />;
    }

    if (loading && orders.length === 0) {
        return (
            <div className="max-w-md mx-auto space-y-4 pt-4 px-6">
                <div className="h-8 bg-[#fff1e7] rounded-full w-48 animate-pulse mb-6" />
                <div className="bg-white rounded-2xl p-4 animate-pulse space-y-3 shadow-sm border border-[#f0e6dd]">
                    <div className="h-4 bg-[#fff1e7] rounded-full w-3/4" />
                    <div className="h-4 bg-[#fff1e7] rounded-full w-1/2" />
                    <div className="h-10 bg-[#fff1e7] rounded-xl mt-4" />
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-['Mulish',sans-serif]">
                <div className="w-24 h-24 bg-[#fff1e7] rounded-full flex items-center justify-center mb-4">
                    <Package size={48} className="text-[#E86A12]/40" />
                </div>
                <h3 className="text-xl font-extrabold text-[#121212] mb-2">Bàn này chưa có đơn hàng</h3>
                <p className="text-[#121212]/40 text-sm max-w-[250px] mb-6">Bạn chưa gọi món hoặc món ăn đã được thanh toán hoàn tất.</p>
                <button
                    onClick={() => navigate('/menu')}
                    className="flex items-center gap-2 bg-[#E86A12] hover:bg-[#d45e0f] text-white px-6 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-[#E86A12]/20 transition-all active:scale-95"
                >
                    Xem thực đơn <ArrowRight size={18} />
                </button>
            </div>
        );
    }

    const grandTotal = orders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
    const allUnpaid = orders.every(o => o.paymentStatus !== 'paid');

    return (
        <div className="max-w-lg mx-auto pb-6 px-6 py-5 font-['Mulish',sans-serif]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#121212]">Đơn hàng của bạn</h1>
                    <p className="text-[#121212]/40 text-sm mt-0.5">Bàn {selectedTable.name}</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="w-10 h-10 flex items-center justify-center text-[#E86A12] bg-[#fff1e7] rounded-xl hover:bg-[#E86A12]/20 transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Order cards */}
            <div className="space-y-4">
                {orders.map((order, idx) => (
                    <OrderCard key={order._id} order={order} defaultOpen={idx === 0} />
                ))}
            </div>

            {/* Grand total if multiple orders */}
            {orders.length > 1 && (
                <div className="mt-4 bg-[#fff1e7] rounded-2xl px-5 py-4 flex justify-between items-center">
                    <p className="font-extrabold text-[#121212] text-sm">Tổng {orders.length} đơn chưa thanh toán</p>
                    <p className="font-extrabold text-[#E86A12] text-xl">{grandTotal.toLocaleString('vi-VN')}đ</p>
                </div>
            )}

            <p className="text-center text-[#121212]/30 text-xs mt-6">
                Vui lòng thanh toán trực tiếp tại quầy hoặc chờ nhân viên dọn bàn hỗ trợ.
            </p>

            {/* Order more button */}
            {allUnpaid && (
                <button
                    onClick={() => navigate('/menu')}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#E86A12] hover:bg-[#d45e0f] text-white py-4 rounded-2xl font-extrabold text-base shadow-lg shadow-[#E86A12]/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Gọi thêm món
                </button>
            )}
        </div>
    );
}
