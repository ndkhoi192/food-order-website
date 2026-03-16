import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);

    const addItem = useCallback((product, quantity = 1, options = []) => {
        setItems(prev => {
            const key = product._id + JSON.stringify(options);
            const optionsExtra = (options || []).reduce((sum, o) => sum + (o.priceDelta || 0), 0);
            const unitPrice = product.basePrice + optionsExtra;
            const existing = prev.find(i => i._key === key);
            if (existing) {
                return prev.map(i => i._key === key
                    ? { ...i, quantity: i.quantity + quantity, lineTotal: i.unitPrice * (i.quantity + quantity) }
                    : i
                );
            }
            return [...prev, {
                _key: key,
                productId: product._id,
                name: product.name,
                basePrice: product.basePrice,
                unitPrice,
                imageUrl: product.imageUrl,
                quantity,
                options,
                lineTotal: unitPrice * quantity,
            }];
        });
    }, []);

    const updateQty = useCallback((key, qty) => {
        if (qty <= 0) {
            setItems(prev => prev.filter(i => i._key !== key));
        } else {
            setItems(prev => prev.map(i => i._key === key ? { ...i, quantity: qty, lineTotal: i.unitPrice * qty } : i));
        }
    }, []);

    const removeItem = useCallback((key) => {
        setItems(prev => prev.filter(i => i._key !== key));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const subTotal = items.reduce((s, i) => s + i.lineTotal, 0);

    return (
        <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, subTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be inside CartProvider');
    return ctx;
};
