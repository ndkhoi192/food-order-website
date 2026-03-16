import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ShoppingBag, Star, Clock, Flame, Heart } from 'lucide-react';
import { productApi, IMAGE_BASE_URL } from '../services/api';
import { useCart } from '../context/CartContext';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [liked, setLiked] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        productApi.getById(id)
            .then(res => {
                setProduct(res.data);
                // set default options
                const defaults = {};
                (res.data.optionGroups || []).forEach(g => {
                    const def = g.items.find(i => i.isDefault);
                    if (def) defaults[g.type] = def.code;
                });
                setSelectedOptions(defaults);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 px-6 pt-4">
                <div className="h-72 bg-[#fff1e7] rounded-3xl" />
                <div className="h-6 bg-[#fff1e7] rounded-full w-3/4" />
                <div className="h-4 bg-[#fff1e7] rounded-full w-1/2" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 font-['Mulish',sans-serif]">
                <div className="text-6xl mb-4">😕</div>
                <h2 className="text-2xl font-extrabold text-[#121212] mb-2">Không tìm thấy món</h2>
                <button onClick={() => navigate('/menu')} className="text-[#E86A12] underline font-bold">Quay lại thực đơn</button>
            </div>
        );
    }

    const imgSrc = product.imageUrl
        ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${IMAGE_BASE_URL}${product.imageUrl}`)
        : FALLBACK;

    const calcTotal = () => {
        let extra = 0;
        (product.optionGroups || []).forEach(g => {
            const selected = g.items.find(i => i.code === selectedOptions[g.type]);
            if (selected) extra += selected.priceDelta;
        });
        return (product.basePrice + extra) * quantity;
    };

    const handleAddToCart = () => {
        const chosenOptions = Object.entries(selectedOptions).map(([type, code]) => {
            const group = product.optionGroups.find(g => g.type === type);
            const item = group?.items.find(i => i.code === code);
            return { type, groupName: group?.name, label: item?.label, priceDelta: item?.priceDelta || 0 };
        });
        addItem(product, quantity, chosenOptions);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="relative pb-32 md:pb-0 font-['Mulish',sans-serif]">
            {/* Back + Like */}
            <div className="flex items-center justify-between mb-4 px-6 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#121212]/60 hover:text-[#121212] font-bold transition-colors"
                >
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#f0e6dd]">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-sm">Quay lại</span>
                </button>
                <button
                    onClick={() => setLiked(!liked)}
                    className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#f0e6dd] transition-transform active:scale-90"
                >
                    <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-[#121212]/30'} />
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start px-6">
                {/* Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-square md:aspect-video bg-[#fff1e7]">
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" onError={e => { e.target.src = FALLBACK; }} />
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-extrabold text-[#121212]">4.8</span>
                            <span className="text-xs text-[#121212]/40">(124)</span>
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
                        <Clock size={14} className="text-[#E86A12]" />
                        <span className="text-sm font-bold text-[#121212]">15–20 phút</span>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-5">
                    {/* Name & Price */}
                    <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-[#121212] leading-tight">{product.name}</h1>
                            {!product.isActive && (
                                <span className="bg-red-100 text-red-600 text-xs font-extrabold px-2 py-1 rounded-lg flex-shrink-0">Hết hàng</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-extrabold text-[#E86A12]">
                                {Number(calcTotal()).toLocaleString('vi-VN')}đ
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[#E86A12] bg-[#fff1e7] px-2 py-1 rounded-lg font-bold">
                                <Flame size={12} /> Phổ biến
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-[#FCF8F5] rounded-2xl p-4">
                            <h3 className="text-sm font-extrabold text-[#121212]/60 mb-1 uppercase tracking-wide">Mô tả</h3>
                            <p className="text-[#121212]/60 text-sm leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    {/* Option Groups */}
                    {(product.optionGroups || []).filter(g => g.items.length > 0).map(group => (
                        <div key={group.type}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-extrabold text-[#121212]/70">{group.name}</h3>
                                {group.required && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Bắt buộc</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.items.filter(i => i.isActive).map(item => (
                                    <button
                                        key={item.code}
                                        onClick={() => setSelectedOptions(prev => ({ ...prev, [group.type]: item.code }))}
                                        className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedOptions[group.type] === item.code
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

                    {/* Desktop Action */}
                    <div className="hidden md:flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-3 bg-[#FCF8F5] px-4 py-2 rounded-2xl">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-[#E86A12] transition-colors"
                            >
                                <Minus size={15} strokeWidth={3} />
                            </button>
                            <span className="text-lg font-extrabold w-5 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-[#E86A12] transition-colors"
                            >
                                <Plus size={15} strokeWidth={3} />
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.isActive}
                            className={`flex-1 py-3.5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${added ? 'bg-green-500 shadow-green-200' : 'bg-[#E86A12] hover:bg-[#d45e0f] shadow-[#E86A12]/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <ShoppingBag size={20} />
                            {added ? '✓ Đã thêm!' : `Thêm vào giỏ — ${Number(calcTotal()).toLocaleString('vi-VN')}đ`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Action Bar */}
            <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden p-4 bg-white/95 backdrop-blur-md border-t border-[#f0e6dd] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-[#FCF8F5] px-4 py-2 rounded-2xl">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-lg font-extrabold w-5 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={!product.isActive}
                        className={`flex-1 py-3.5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${added ? 'bg-green-500' : 'bg-[#E86A12] hover:bg-[#d45e0f]'} disabled:opacity-50`}
                    >
                        <ShoppingBag size={18} />
                        {added ? '✓ Đã thêm!' : `Thêm — ${Number(calcTotal()).toLocaleString('vi-VN')}đ`}
                    </button>
                </div>
            </div>
        </div>
    );
}
