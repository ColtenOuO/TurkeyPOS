import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Utensils, Trash2, ChevronRight } from 'lucide-react';
import type { Category, Product, CartItem, ProductOption } from '../types';
import SelectionModal from '../components/SelectionModal';
import VirtualKeyboard from '../components/VirtualKeyboard';
import SuccessModal from '../components/SuccessModal';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const POS: React.FC = () => {
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [tableNumber, setTableNumber] = useState<string>("");
    const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get<Category[]>(`${API_BASE}/menu/`);
                setMenu(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
    };

    const confirmSelection = (options: ProductOption[], quantity: number) => {
        if (!selectedProduct) return;

        const extraPrice = options.reduce((sum, opt) => sum + opt.price_delta, 0);
        const totalUnitPrice = selectedProduct.base_price + extraPrice;

        const newItem: CartItem = {
            ...selectedProduct,
            total_unit_price: totalUnitPrice,
            base_price: selectedProduct.base_price,
            quantity: quantity,
            selected_option_ids: options.map(o => o.id)
        };

        setCart(prev => [...prev, newItem]);
        setSelectedProduct(null);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            if (!tableNumber) {
                alert("請輸入桌號");
                return;
            }
            const orderPayload = {
                table_number: tableNumber,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    option_ids: item.selected_option_ids
                }))
            };
            await axios.post(`${API_BASE}/orders/`, orderPayload);
            setShowSuccess(true);
            setCart([]);
            setTableNumber(""); // Reset table number after order
        } catch (err) {
            alert("送單失敗");
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-orange-500">
            LOADING...
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden font-sans">
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 flex items-center gap-4 italic tracking-tight drop-shadow-sm">
                            <Utensils size={48} className="text-orange-600" /> TurkeyPOS
                        </h1>
                        <p className="text-slate-500 font-bold ml-16 mt-2 tracking-widest text-sm uppercase">Version 1.0.0</p>
                    </div>
                </header>

                {menu.map(cat => (
                    <section key={cat.id} className="mb-16">
                        <h2 className="text-3xl font-black mb-8 text-slate-800 flex items-center gap-4">
                            <span className="w-2 h-10 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-200"></span>
                            {cat.name}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cat.products.map(p => (
                                <button key={p.id} onClick={() => handleProductClick(p)}
                                    className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 text-left hover:-translate-y-1 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="font-black text-2xl mb-3 text-slate-800 group-hover:text-orange-600 transition-colors">{p.name}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-3xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">${p.base_price}</div>
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            <aside className="w-[480px] bg-white/90 backdrop-blur-xl border-l border-white shadow-2xl flex flex-col z-20">
                <div className="p-8 border-b border-slate-100 bg-white/50">
                    <h2 className="font-black text-3xl flex items-center gap-3 text-slate-800">
                        <ShoppingCart className="text-orange-500 fill-orange-500" size={32} /> List
                    </h2>
                    <div className="mt-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Table Number</label>
                        <input
                            type="text"
                            value={tableNumber}
                            readOnly
                            onClick={() => setShowKeyboard(true)}
                            placeholder="Tap to enter"
                            className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none cursor-pointer caret-transparent"
                        />
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {cart.map((item, i) => {
                        const selectedOptions = item.options.filter(opt => item.selected_option_ids.includes(opt.id));
                        return (
                            <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                <div className="font-black text-xl text-slate-800 pr-12">{item.name}</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-500 border border-slate-200">
                                        數量: {item.quantity}
                                    </span>
                                    {selectedOptions.map(opt => (
                                        <span key={opt.id} className="bg-orange-50 px-3 py-1 rounded-full text-xs font-black text-orange-600 border border-orange-100">
                                            + {opt.name}
                                        </span>
                                    ))}
                                </div>
                                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="absolute right-6 bottom-6 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={20} />
                                </button>
                                <div className="absolute right-6 top-6 text-2xl font-black text-slate-900">
                                    ${item.total_unit_price * item.quantity}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 bg-white/50 backdrop-blur border-t border-slate-100">
                    <div className="flex justify-between items-end mb-8">
                        <span className="text-slate-400 font-black text-lg">TOTAL</span>
                        <span className="text-6xl font-black text-slate-900 tracking-tighter">
                            <span className="text-3xl text-orange-500 mr-2">$</span>
                            {cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0)}
                        </span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300/50 active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-400 transition-all flex items-center justify-center gap-3">
                        CHECKOUT <ChevronRight strokeWidth={4} />
                    </button>
                </div>
            </aside>

            {selectedProduct && (
                <SelectionModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onConfirm={confirmSelection}
                />
            )}

            {showKeyboard && (
                <VirtualKeyboard
                    initialValue={tableNumber}
                    onClose={() => setShowKeyboard(false)}
                    onConfirm={(val) => {
                        setTableNumber(val);
                        setShowKeyboard(false);
                    }}
                />
            )}

            {showSuccess && (
                <SuccessModal
                    message="Order Submitted!"
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </div>
    );
};

export default POS;
