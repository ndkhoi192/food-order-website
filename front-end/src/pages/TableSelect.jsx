import { useNavigate } from 'react-router-dom';
import { useTable } from '../context/TableContext';
import { QrCode, UtensilsCrossed, LogIn } from 'lucide-react';
import { useEffect } from 'react';

export default function TableSelect() {
    const navigate = useNavigate();
    const { selectedTable } = useTable();

    // If table is already set (e.g. from QR scan), go straight to menu
    useEffect(() => {
        if (selectedTable) {
            navigate('/menu', { replace: true });
        }
    }, [selectedTable, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FCF8F5] via-white to-[#fff1e7]/30 font-['Mulish',sans-serif] flex items-center justify-center px-4">
            <div className="text-center max-w-sm w-full">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#E86A12] to-[#d45e0f] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E86A12]/20">
                        <UtensilsCrossed size={36} className="text-white" />
                    </div>
                    <h1 className="font-extrabold text-[#121212] text-3xl">
                        Food<span className="text-[#E86A12]">ie</span>
                    </h1>
                    <p className="text-[#121212]/40 text-sm mt-1">Đặt món nhanh, không cần chờ đợi</p>
                </div>

                {/* QR Prompt Card */}
                <div className="bg-white rounded-3xl border border-[#f0e6dd] p-8 shadow-sm mb-6">
                    <div className="w-24 h-24 bg-[#fff1e7] rounded-2xl flex items-center justify-center mx-auto mb-5 border-2 border-dashed border-[#E86A12]/30">
                        <QrCode size={48} className="text-[#E86A12]" />
                    </div>
                    <h2 className="text-[#121212] font-extrabold text-xl mb-2">Quét mã QR trên bàn</h2>
                    <p className="text-[#121212]/40 text-sm leading-relaxed">
                        Mỗi bàn có một mã QR riêng. Hãy dùng camera điện thoại quét mã QR trên bàn của bạn để bắt đầu gọi món.
                    </p>
                </div>

                {/* Steps */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    {[
                        { step: '1', text: 'Quét QR' },
                        { step: '2', text: 'Chọn món' },
                        { step: '3', text: 'Thanh toán' },
                    ].map((s, i) => (
                        <div key={s.step} className="flex items-center gap-3">
                            <div className="text-center">
                                <div className="w-8 h-8 bg-[#E86A12] text-white rounded-full flex items-center justify-center text-xs font-extrabold mb-1">
                                    {s.step}
                                </div>
                                <p className="text-[10px] text-[#121212]/40 font-bold">{s.text}</p>
                            </div>
                            {i < 2 && <div className="w-6 h-px bg-[#E86A12]/20 mt-[-12px]" />}
                        </div>
                    ))}
                </div>

                {/* Staff Link */}
                <button
                    onClick={() => navigate('/staff/login')}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#121212]/40 hover:text-[#E86A12] mx-auto px-4 py-2 rounded-xl hover:bg-[#fff1e7] transition-all"
                >
                    <LogIn size={14} />
                    Nhân viên / Quản lý
                </button>
            </div>
        </div>
    );
}
