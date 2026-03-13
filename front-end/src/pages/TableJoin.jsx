import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tableApi } from '../services/api';
import { useTable } from '../context/TableContext';
import { Loader2, CheckCircle2, XCircle, QrCode } from 'lucide-react';

export default function TableJoin() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { selectTable } = useTable();
    const [status, setStatus] = useState(() => token ? 'loading' : 'error');
    const [tableName, setTableName] = useState('');
    const [errorMsg, setErrorMsg] = useState(() => token ? '' : 'Không tìm thấy mã QR');

    useEffect(() => {
        if (!token) return;

        tableApi.getByQrToken(token)
            .then(res => {
                const table = res.data;
                selectTable(table);
                setTableName(table.name);
                setStatus('success');
                // Redirect to menu after a brief success animation
                setTimeout(() => navigate('/menu', { replace: true }), 1200);
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('Mã QR không hợp lệ hoặc bàn không hoạt động');
            });
    }, [token, selectTable, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FCF8F5] via-white to-[#fff1e7]/30 font-['Mulish',sans-serif] flex items-center justify-center px-4">
            <div className="text-center max-w-sm w-full">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#E86A12] to-[#d45e0f] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E86A12]/20">
                        <QrCode size={28} className="text-white" />
                    </div>
                    <h1 className="font-extrabold text-[#121212] text-2xl">
                        Food<span className="text-[#E86A12]">ie</span>
                    </h1>
                </div>

                {/* Status */}
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl border border-[#f0e6dd] p-8 shadow-sm">
                        <Loader2 size={48} className="text-[#E86A12] animate-spin mx-auto mb-4" />
                        <p className="text-[#121212] font-extrabold text-lg mb-1">Đang xác nhận bàn...</p>
                        <p className="text-[#121212]/40 text-sm">Vui lòng đợi trong giây lát</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-emerald-600" />
                        </div>
                        <p className="text-[#121212] font-extrabold text-lg mb-1">Xác nhận thành công!</p>
                        <p className="text-[#121212]/40 text-sm mb-3">
                            Bạn đang ngồi tại <span className="font-extrabold text-[#E86A12]">Bàn {tableName}</span>
                        </p>
                        <p className="text-xs text-[#121212]/30">Đang chuyển đến menu...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-sm">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <p className="text-[#121212] font-extrabold text-lg mb-1">Không thể xác nhận</p>
                        <p className="text-[#121212]/40 text-sm mb-6">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-[#E86A12] hover:bg-[#d45e0f] text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-[#E86A12]/20 transition-all"
                        >
                            Về trang chủ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
