import { ShoppingBag, TableProperties, X, Menu as MenuIcon, MapPin } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTable } from '../context/TableContext';

export default function Header() {
    const { totalItems } = useCart();
    const { selectedTable, clearTable } = useTable();
    const navigate = useNavigate();

    const handleClearTable = () => {
        if (confirm('Bỏ chọn bàn và quay về trang chọn bàn?')) {
            clearTable();
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-[#FCF8F5]">
            {/* Top bar */}
            <div className="max-w-7xl mx-auto px-6 pt-6 pb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Hamburger */}
                    <button className="w-7 h-6 flex flex-col justify-between">
                        <span className="block w-full h-[3px] bg-[#121212] rounded-full" />
                        <span className="block w-5 h-[3px] bg-[#121212] rounded-full" />
                        <span className="block w-full h-[3px] bg-[#121212] rounded-full" />
                    </button>
                    {/* Logo */}
                    <Link to="/menu" className="flex items-center gap-1 flex-shrink-0">
                        <span className="font-extrabold text-xl text-[#121212] tracking-tight">
                            Food<span className="text-[#E86A12]">ie</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {/* Table Badge */}
                    {selectedTable && (
                        <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[13px] text-[#E86A12] tracking-[0.75px] uppercase">
                                Bàn {selectedTable.name}
                            </span>
                            <button
                                onClick={handleClearTable}
                                className="text-[#E86A12] hover:text-[#d45e0f] transition-colors"
                                title="Đổi bàn"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#E86A12] hover:bg-[#d45e0f] transition-colors"
                    >
                        <ShoppingBag size={18} className="text-white" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-white text-[#E86A12] text-[11px] font-extrabold rounded-full flex items-center justify-center px-1 border-2 border-[#E86A12]">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 px-6 pb-2">
                {[
                    { path: '/menu', label: 'Thực đơn' },
                    { path: '/orders', label: 'Đơn hàng' },
                ].map(({ path, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                ? 'bg-[#fff1e7] text-[#E86A12]'
                                : 'text-[#121212]/60 hover:text-[#121212] hover:bg-[#fff1e7]/50'
                            }`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}
