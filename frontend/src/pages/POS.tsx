import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Utensils, Trash2, ChevronRight, LogOut, ArrowLeft, Store, Calculator } from 'lucide-react';
import type { Category, Product, CartItem, ProductOption } from '../types';
import SelectionModal from '../components/SelectionModal';
import VirtualKeyboard from '../components/VirtualKeyboard';
import SuccessModal from '../components/SuccessModal';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const POS: React.FC = () => {
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [tableNumber, setTableNumber] = useState<string>("");
    const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
    const [showCalcKeyboard, setShowCalcKeyboard] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [isTakeout, setIsTakeout] = useState<boolean>(false);
    const [receivedAmount, setReceivedAmount] = useState<string>("");

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
            if (!tableNumber && !isTakeout) {
                alert("內用請輸入桌號，或選擇外帶");
                return;
            }
            const orderPayload = {
                table_number: isTakeout ? "Takeout" : tableNumber,
                order_type: isTakeout ? "takeout" : "dine_in",
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
            setIsTakeout(false); // Reset to dine-in
            setReceivedAmount(""); // Reset calculator
            setSelectedCategory(null); // Return to category view
        } catch (err) {
            alert("送單失敗");
            console.error(err);
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-orange-500 text-xl">
            載入中... (LOADING)
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden font-sans">
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 flex items-center gap-4 italic tracking-tight drop-shadow-sm">
                            <Utensils size={48} className="text-orange-600" /> TurkeyPOS
                        </h1>
                        <p className="text-slate-500 font-bold ml-16 mt-2 tracking-widest text-sm uppercase">Version 1.1.0</p>
                    </div>
                </header>
                <div className="absolute top-8 right-8 flex gap-4 z-50">
                    <button
                        onClick={() => window.open('/kitchen', '_blank')}
                        className="px-6 py-3 bg-white rounded-xl shadow-md text-slate-600 font-bold hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-2"
                    >
                        <Store size={20} /> 管理訂單
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("確定要登出分店系統嗎？")) {
                                localStorage.removeItem('token');
                                window.location.href = "/store-login";
                            }
                        }}
                        className="p-3 bg-white rounded-xl shadow-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="登出"
                    >
                        <LogOut size={24} />
                    </button>
                </div>

                {selectedCategory ? (
                    // Product View
                    <div className="animate-in fade-in slide-in-from-right duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-110 transition-all"
                            >
                                <ArrowLeft size={28} strokeWidth={3} />
                            </button>
                            <h2 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                                <span className="w-3 h-12 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-200"></span>
                                {selectedCategory.name}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {selectedCategory.products.map(p => (
                                <button key={p.id} onClick={() => handleProductClick(p)}
                                    className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 text-left hover:-translate-y-1 overflow-hidden h-full flex flex-col justify-between">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 w-full">
                                        <div className="font-black text-2xl mb-4 text-slate-800 group-hover:text-orange-600 transition-colors leading-tight">{p.name}</div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="text-3xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">${p.base_price}</div>
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Category View
                    <div className="animate-in fade-in slide-in-from-left duration-300">
                        <h2 className="text-3xl font-black mb-8 text-slate-600 ml-2">請選擇分類 (Choose Category)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                            {menu.map(cat => (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                                    className="group relative bg-white p-12 rounded-[3rem] border-2 border-transparent hover:border-orange-100 shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 text-left hover:-translate-y-2">
                                    <div className="font-black text-4xl mb-2 text-slate-800 group-hover:text-orange-600 transition-colors">{cat.name}</div>
                                    <div className="text-slate-400 font-bold group-hover:text-orange-400 transition-colors">{cat.products.length} Items</div>
                                    <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Utensils size={100} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <aside className="w-[480px] bg-white/90 backdrop-blur-xl border-l border-white shadow-2xl flex flex-col z-20">
                <div className="p-8 border-b border-slate-100 bg-white/50">
                    <h2 className="font-black text-3xl flex items-center text-slate-800">
                        <ShoppingCart className="text-orange-500 fill-orange-500" size={40} />
                    </h2>

                    <div className="mt-6 flex bg-slate-100 p-1 rounded-xl">
                        <button
                            className={`flex-1 py-3 rounded-lg font-bold transition-all text-lg ${!isTakeout ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                            onClick={() => setIsTakeout(false)}
                        >
                            內用 (Dine-in)
                        </button>
                        <button
                            className={`flex-1 py-3 rounded-lg font-bold transition-all text-lg ${isTakeout ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            onClick={() => setIsTakeout(true)}
                        >
                            外帶 (Takeout)
                        </button>
                    </div>

                    {!isTakeout && (
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">桌號 (Table)</label>
                            <input
                                type="text"
                                value={tableNumber}
                                readOnly
                                onClick={() => setShowKeyboard(true)}
                                placeholder="點擊輸入"
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none cursor-pointer caret-transparent text-xl"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {cart.map((item, i) => {
                        const selectedOptions = item.options.filter(opt => item.selected_option_ids.includes(opt.id));
                        return (
                            <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                <div className="font-black text-xl text-slate-800 pr-12">{item.name}</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-500 border border-slate-200">
                                        x {item.quantity}
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
                    {/* Change Calculator */}
                    <div className="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-500 font-bold flex items-center gap-2">
                                <Calculator size={18} /> 收到金額
                            </span>
                            <div
                                onClick={() => setShowCalcKeyboard(true)}
                                className="w-32 bg-white px-4 py-2 rounded-xl text-right font-black text-slate-800 shadow-sm border border-slate-200 cursor-pointer hover:border-orange-300 transition-colors text-xl"
                            >
                                {receivedAmount || <span className="text-slate-300 text-base">輸入</span>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                            <span className="text-slate-500 font-bold">找零 (Change)</span>
                            <span className={`text-2xl font-black ${(Number(receivedAmount) - cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0)) < 0
                                ? 'text-red-500'
                                : 'text-green-600'
                                }`}>
                                ${Number(receivedAmount) ? (Number(receivedAmount) - cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0)) : 0}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-8">
                        <span className="text-slate-400 font-black text-lg">總金額 (TOTAL)</span>
                        <span className="text-6xl font-black text-slate-900 tracking-tighter">
                            <span className="text-3xl text-orange-500 mr-2">$</span>
                            {cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0)}
                        </span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300/50 active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-400 transition-all flex items-center justify-center gap-3">
                        結帳 (CHECKOUT) <ChevronRight strokeWidth={4} />
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
                    title="輸入桌號 (Table Number)"
                    initialValue={tableNumber}
                    onClose={() => setShowKeyboard(false)}
                    onConfirm={(val) => {
                        setTableNumber(val);
                        setShowKeyboard(false);
                    }}
                    mode="alphanumeric"
                />
            )}

            {showCalcKeyboard && (
                <VirtualKeyboard
                    title="輸入收到金額 (Received)"
                    initialValue={receivedAmount}
                    onClose={() => setShowCalcKeyboard(false)}
                    onConfirm={(val) => {
                        setReceivedAmount(val);
                        setShowCalcKeyboard(false);
                    }}
                    mode="numeric"
                />
            )}

            {showSuccess && (
                <SuccessModal
                    message="訂單已送出! (Order Submitted)"
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </div>
    );
};

export default POS;
