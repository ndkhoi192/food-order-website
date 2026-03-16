import { useState, useEffect } from 'react';
import { Search, X, Plus, Minus, ShoppingBag, Star, Clock, Flame } from 'lucide-react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { productApi, categoryApi, IMAGE_BASE_URL } from '../services/api';
import { useTable } from '../context/TableContext';
import { useCart } from '../context/CartContext';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';

export default function Menu() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [selectedCat, setSelectedCat] = useState(searchParams.get('cat') || 'all');
    const { selectedTable } = useTable();
    const { addItem, totalItems, subTotal } = useCart();
    const navigate = useNavigate();

    // Product popup state
    const [popupProduct, setPopupProduct] = useState(null);
    const [popupQty, setPopupQty] = useState(1);
    const [popupOptions, setPopupOptions] = useState({});
    const [popupAdded, setPopupAdded] = useState(false);

    const openProductPopup = (product) => {
        const defaults = {};
        (product.optionGroups || []).forEach(g => {
            const def = g.items.find(i => i.isDefault);
            if (def) defaults[g.type] = def.code;
        });
        setPopupOptions(defaults);
        setPopupQty(1);
        setPopupAdded(false);
        setPopupProduct(product);
    };

    const closePopup = () => setPopupProduct(null);

    const calcPopupTotal = () => {
        if (!popupProduct) return 0;
        let extra = 0;
        (popupProduct.optionGroups || []).forEach(g => {
            const selected = g.items.find(i => i.code === popupOptions[g.type]);
            if (selected) extra += selected.priceDelta;
        });
        return (popupProduct.basePrice + extra) * popupQty;
    };

    const handlePopupAddToCart = () => {
        if (!popupProduct) return;
        const chosenOptions = Object.entries(popupOptions).map(([type, code]) => {
            const group = popupProduct.optionGroups.find(g => g.type === type);
            const item = group?.items.find(i => i.code === code);
            return { type, groupName: group?.name, label: item?.label, priceDelta: item?.priceDelta || 0 };
        });
        addItem(popupProduct, popupQty, chosenOptions);
        setPopupAdded(true);
        setTimeout(() => {
            setPopupAdded(false);
            closePopup();
        }, 1200);
    };

    if (!selectedTable) {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        categoryApi.getAll().then(res => setCategories(res.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        productApi.getAll()
            .then(res => setProducts(res.data || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = products.filter(p => {
        const matchCat = selectedCat === 'all' || p.categoryId === selectedCat || (p.categoryId?._id && p.categoryId._id === selectedCat);
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const handleCatSelect = (id) => {
        setSelectedCat(id);
        setSearchParams(id === 'all' ? {} : { cat: id });
    };

    const handleAdd = (e, product) => {
        e.stopPropagation();
        openProductPopup(product);
    };

    const getImgSrc = (product) => {
        if (product.imageUrl) {
            return product.imageUrl.startsWith('http') ? product.imageUrl : `${IMAGE_BASE_URL}${product.imageUrl}`;
        }
        return FALLBACK;
    };

    return (
        <div className="font-['Mulish',sans-serif]">
            {/* Cream header area */}
            <div className="bg-[#FCF8F5] pb-5">
                {/* Address / Location bar */}
                <div className="mx-6 bg-[#fff1e7] rounded-lg flex items-center justify-between px-3 py-2.5">
                    <span className="font-bold text-[14px] text-[#E86A12] tracking-[0.25px]">
                        Bàn {selectedTable.name} • Gọi món tại chỗ
                    </span>
                    <div className="w-4 h-4 text-[#E86A12] opacity-80">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Search */}
                <div className="mx-6 mt-4 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#121212]/30" size={18} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        type="text"
                        placeholder="Tìm kiếm món ăn..."
                        className="w-full bg-white border border-[#f0e6dd] rounded-2xl py-3 pl-11 pr-12 text-sm font-medium placeholder:text-[#121212]/30 focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] shadow-sm"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#121212]/30 hover:text-[#121212]/60">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-2.5 px-6 mt-5 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => handleCatSelect('all')}
                        className={`flex flex-col items-center gap-2.5 p-2 rounded-xl shrink-0 transition-all ${
                            selectedCat === 'all'
                                ? 'bg-[#fcf8f5] border border-[#E86A12] shadow-[0px_4px_14px_0px_rgba(0,0,0,0.12)]'
                                : 'border border-transparent'
                        }`}
                    >
                        <div className="w-16 h-16 rounded-full bg-[#fff1e7] flex items-center justify-center text-2xl">
                            🍽️
                        </div>
                        <span className={`text-[14px] tracking-[0.25px] text-[#121212] leading-[1.2] ${
                            selectedCat === 'all' ? 'font-extrabold' : 'font-bold'
                        }`}>
                            Tất cả
                        </span>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => handleCatSelect(cat._id)}
                            className={`flex flex-col items-center gap-2.5 p-2 rounded-xl shrink-0 transition-all ${
                                selectedCat === cat._id
                                    ? 'bg-[#fcf8f5] border border-[#E86A12] shadow-[0px_4px_14px_0px_rgba(0,0,0,0.12)]'
                                    : 'border border-transparent'
                            }`}
                        >
                            <div className="w-16 h-16 rounded-full bg-[#fff1e7] flex items-center justify-center overflow-hidden">
                                {cat.imageUrl ? (
                                    <img src={cat.imageUrl.startsWith('http') ? cat.imageUrl : `${IMAGE_BASE_URL}${cat.imageUrl}`} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🍽️</span>
                                )}
                            </div>
                            <span className={`text-[14px] tracking-[0.25px] text-[#121212] leading-[1.2] ${
                                selectedCat === cat._id ? 'font-extrabold' : 'font-bold'
                            }`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product list */}
            <div className="px-6 py-5 pb-24 flex flex-col gap-3">
                {/* Result count */}
                {!loading && (
                    <p className="text-sm text-[#121212]/50 font-bold mb-1">
                        Tìm thấy <span className="text-[#E86A12] font-extrabold">{filtered.length}</span> món
                        {search && <> cho "<span className="font-bold">{search}</span>"</>}
                    </p>
                )}

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gradient-to-r from-[#fff1e8] to-transparent rounded-[13px] h-[120px] animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-extrabold text-[#121212] mb-2">Không tìm thấy món</h3>
                        <p className="text-[#121212]/40 text-sm">Thử từ khóa khác hoặc chọn danh mục khác</p>
                        <button
                            onClick={() => { setSearch(''); setSelectedCat('all'); }}
                            className="mt-4 px-5 py-2.5 bg-[#E86A12] text-white rounded-xl font-extrabold hover:bg-[#d45e0f] transition-colors"
                        >
                            Xem tất cả
                        </button>
                    </div>
                ) : (
                    filtered.map(product => {
                        const imgSrc = getImgSrc(product);
                        return (
                            <div
                                key={product._id}
                                onClick={() => openProductPopup(product)}
                                className="bg-gradient-to-r from-[#fff1e8] from-[5%] to-transparent to-[97%] rounded-[13px] h-[120px] relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                            >
                                {/* Product image */}
                                <div className="absolute left-[-20px] top-[-5px] w-[130px] h-[130px] flex items-center justify-center">
                                    <img
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        src={imgSrc}
                                        onError={(e) => { e.target.src = FALLBACK; }}
                                    />
                                </div>

                                {/* Text content */}
                                <div className="absolute left-[115px] top-[15px] flex flex-col gap-2 pr-4 ms-3">
                                    <p className="font-bold text-[18px] md:text-[20px] text-[#121212] leading-none whitespace-nowrap">
                                        {product.name}
                                    </p>
                                    <p className="font-light text-[13px] md:text-[14px] text-[#121212] opacity-80 leading-[1.3] tracking-[-0.25px] max-w-[200px] line-clamp-2">
                                        {product.description || product.name}
                                    </p>
                                    <p className="font-bold text-[14px] text-[#121212] tracking-[0.25px] leading-none">
                                        {Number(product.basePrice).toLocaleString('vi-VN')}đ
                                    </p>
                                </div>

                                {/* Add button */}
                                <button
                                    onClick={(e) => handleAdd(e, product)}
                                    className="absolute bottom-0 right-0 bg-[#E86A12] rounded-tl-[13px] flex items-center gap-1 pl-2.5 pr-3.5 py-2 hover:bg-[#d45e0f] transition-colors"
                                >
                                    <Plus size={14} className="text-white" strokeWidth={3} />
                                    <span className="font-extrabold text-[13px] text-white tracking-[0.75px] uppercase">
                                        Add
                                    </span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ===== PRODUCT DETAIL POPUP ===== */}
            {popupProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePopup} />

                    {/* Modal */}
                    <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        {/* Close */}
                        <button
                            onClick={closePopup}
                            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-gray-50"
                        >
                            <X size={16} className="text-[#121212]/60" />
                        </button>

                        {/* Image */}
                        <div className="relative w-full aspect-[4/3] bg-[#fff1e7] overflow-hidden sm:rounded-t-3xl rounded-t-3xl">
                            <img
                                src={getImgSrc(popupProduct)}
                                alt={popupProduct.name}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.src = FALLBACK; }}
                            />
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
                                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs font-extrabold text-[#121212]">4.8</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
                                    <Clock size={13} className="text-[#E86A12]" />
                                    <span className="text-xs font-bold text-[#121212]">15–20'</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Name & Price */}
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <h2 className="text-xl font-extrabold text-[#121212] leading-tight">{popupProduct.name}</h2>
                                    <span className="flex items-center gap-1 text-[11px] text-[#E86A12] bg-[#fff1e7] px-2 py-1 rounded-lg font-bold flex-shrink-0">
                                        <Flame size={11} /> Phổ biến
                                    </span>
                                </div>
                                <p className="text-2xl font-extrabold text-[#E86A12]">
                                    {Number(calcPopupTotal()).toLocaleString('vi-VN')}đ
                                </p>
                            </div>

                            {/* Description */}
                            {popupProduct.description && (
                                <p className="text-sm text-[#121212]/50 leading-relaxed">
                                    {popupProduct.description}
                                </p>
                            )}

                            {/* Option Groups */}
                            {(popupProduct.optionGroups || []).filter(g => g.items.length > 0).map(group => (
                                <div key={group.type}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-extrabold text-[#121212]/70">{group.name}</h3>
                                        {group.required && (
                                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Bắt buộc</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.items.filter(i => i.isActive !== false).map(item => (
                                            <button
                                                key={item.code}
                                                onClick={() => setPopupOptions(prev => ({ ...prev, [group.type]: item.code }))}
                                                className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                                    popupOptions[group.type] === item.code
                                                        ? 'border-[#E86A12] bg-[#fff1e7] text-[#E86A12]'
                                                        : 'border-[#f0e6dd] bg-white text-[#121212]/60 hover:border-[#E86A12]/30'
                                                }`}
                                            >
                                                {item.label}
                                                {item.priceDelta !== 0 && (
                                                    <span className="ml-1 text-xs opacity-70">
                                                        {item.priceDelta > 0 ? '+' : ''}{Number(item.priceDelta).toLocaleString('vi-VN')}đ
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Quantity + Add to Cart */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex items-center gap-3 bg-[#FCF8F5] px-3 py-2 rounded-2xl">
                                    <button
                                        onClick={() => setPopupQty(Math.max(1, popupQty - 1))}
                                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-[#E86A12] transition-colors"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <span className="text-lg font-extrabold w-5 text-center">{popupQty}</span>
                                    <button
                                        onClick={() => setPopupQty(popupQty + 1)}
                                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-[#E86A12] transition-colors"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                                <button
                                    onClick={handlePopupAddToCart}
                                    disabled={!popupProduct.isActive}
                                    className={`flex-1 py-3.5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                                        popupAdded
                                            ? 'bg-green-500 shadow-green-200'
                                            : 'bg-[#E86A12] hover:bg-[#d45e0f] shadow-[#E86A12]/20'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <ShoppingBag size={18} />
                                    {popupAdded ? '✓ Đã thêm!' : `Thêm — ${Number(calcPopupTotal()).toLocaleString('vi-VN')}đ`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FLOATING CART BAR ===== */}
            {totalItems > 0 && !popupProduct && (
                <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-white/95 backdrop-blur-md border-t border-[#f0e6dd] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full bg-[#E86A12] hover:bg-[#d45e0f] text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-lg shadow-[#E86A12]/20 transition-all active:scale-95"
                    >
                        <ShoppingBag size={20} />
                        <span>Đi tới giỏ hàng</span>
                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm">
                            {totalItems} món • {Number(subTotal).toLocaleString('vi-VN')}đ
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
