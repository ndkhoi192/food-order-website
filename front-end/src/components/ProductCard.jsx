import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { IMAGE_BASE_URL } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const { addItem } = useCart();

    const imgSrc = product.imageUrl
        ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${IMAGE_BASE_URL}${product.imageUrl}`)
        : FALLBACK;

    const handleAdd = (e) => {
        e.stopPropagation();
        addItem(product, 1);
    };

    return (
        <div
            onClick={() => navigate(`/product/${product._id}`)}
            className="bg-gradient-to-r from-[#fff1e8] from-[5%] to-transparent to-[97%] rounded-[13px] h-[120px] relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group font-['Mulish',sans-serif]"
        >
            {/* Product image */}
            <div className="absolute left-[-20px] top-[-5px] w-[130px] h-[130px] flex items-center justify-center">
                <img
                    alt={product.name}
                    className="w-full h-full object-cover rounded-[10px]"
                    src={imgSrc}
                    onError={(e) => { e.target.src = FALLBACK; }}
                />
            </div>

            {/* Text content */}
            <div className="absolute left-[115px] top-[15px] flex flex-col gap-2 pr-4">
                <p className="font-bold text-[18px] text-[#121212] leading-none whitespace-nowrap">
                    {product.name}
                </p>
                <p className="font-light text-[13px] text-[#121212] opacity-80 leading-[1.3] tracking-[-0.25px] max-w-[180px] line-clamp-2">
                    {product.description || product.name}
                </p>
                <p className="font-bold text-[14px] text-[#121212] tracking-[0.25px] leading-none">
                    {Number(product.basePrice).toLocaleString('vi-VN')}đ
                </p>
            </div>

            {/* Add button */}
            <button
                onClick={handleAdd}
                className="absolute bottom-0 right-0 bg-[#E86A12] rounded-tl-[13px] flex items-center gap-1 pl-2.5 pr-3.5 py-2 hover:bg-[#d45e0f] transition-colors"
            >
                <Plus size={14} className="text-white" strokeWidth={3} />
                <span className="font-extrabold text-[13px] text-white tracking-[0.75px] uppercase">
                    Add
                </span>
            </button>
        </div>
    );
}
