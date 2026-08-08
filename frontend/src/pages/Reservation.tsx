import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Utensils, ShoppingCart, Trash2, ChevronRight, ArrowLeft, Store,
    User, Phone, Building2, MapPin, Clock, CalendarCheck, Check, Copy, Search
} from 'lucide-react';
import type { Category, Product, CartItem, ProductOption, Reservation as ReservationType } from '../types';
import SelectionModal from '../components/SelectionModal';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

type OrderType = 'takeout' | 'delivery';

// 共用樣式：手機上維持 16px 字級，避免 iOS 聚焦時自動放大
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all";
const labelClass = "flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1";

const Reservation: React.FC = () => {
    const [menu, setMenu] = useState<Category[]>([]);
    const [stores, setStores] = useState<{ id: string, name: string, is_active: boolean }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    // 送出成功後保留的 5 位數訂單編號
    const [submittedNo, setSubmittedNo] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // 訂購人資訊
    const [storeId, setStoreId] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [customerUnit, setCustomerUnit] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [orderType, setOrderType] = useState<OrderType>('takeout');
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [pickupTime, setPickupTime] = useState<string>("");

    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menuRes, storeRes] = await Promise.all([
                    axios.get<Category[]>(`${API_BASE}/menu/`),
                    axios.get(`${API_BASE}/stores/`)
                ]);
                setMenu(menuRes.data);

                const activeStores = storeRes.data.filter((s: any) => s.is_active);
                setStores(activeStores);
                if (activeStores.length > 0) setStoreId(activeStores[0].id);
            } catch (err) {
                console.error(err);
                setError("無法載入菜單，請稍後再試");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const total = cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0);
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

    const confirmSelection = (options: ProductOption[], quantity: number) => {
        if (!selectedProduct) return;

        const extraPrice = options.reduce((sum, opt) => sum + opt.price_delta, 0);
        const newItem: CartItem = {
            ...selectedProduct,
            total_unit_price: selectedProduct.base_price + extraPrice,
            base_price: selectedProduct.base_price,
            quantity,
            selected_option_ids: options.map(o => o.id)
        };

        setCart(prev => [...prev, newItem]);
        setSelectedProduct(null);
    };

    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const handleSubmit = async () => {
        setError("");

        if (!storeId) return setError("請選擇取餐分店");
        if (!customerName.trim()) return setError("請填寫訂購人姓名");
        if (!customerPhone.trim()) return setError("請填寫訂購人電話");
        if (orderType === 'delivery' && !deliveryAddress.trim()) return setError("外送訂單請填寫外送地址");
        if (cart.length === 0) return setError("請至少選擇一項餐點");

        setSubmitting(true);
        try {
            const res = await axios.post<ReservationType>(`${API_BASE}/reservations/`, {
                store_id: storeId,
                customer_name: customerName.trim(),
                customer_unit: customerUnit.trim() || null,
                customer_phone: customerPhone.trim(),
                order_type: orderType,
                delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : null,
                pickup_time: pickupTime || null,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    option_ids: item.selected_option_ids
                }))
            });

            setSubmittedNo(res.data.order_no || "");
            setCopied(false);
            setCart([]);
            setCustomerName("");
            setCustomerUnit("");
            setCustomerPhone("");
            setDeliveryAddress("");
            setPickupTime("");
            setOrderType('takeout');
            setSelectedCategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : "預定失敗，請確認資料後再試一次");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-orange-500">
            載入中...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            {/* 手機底部有結帳列，預留空間 */}
            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-28 lg:pb-8">
                <header className="mb-5 sm:mb-7 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 flex items-center gap-2.5 italic tracking-tight">
                            <CalendarCheck size={28} className="text-orange-600 shrink-0" /> 線上預定訂餐
                        </h1>
                        <p className="text-slate-500 font-bold text-sm mt-1.5 sm:ml-10">
                            填寫訂購資訊並選擇餐點，送出後由門市為您準備
                        </p>
                    </div>
                    <Link
                        to="/reserve/status"
                        className="shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:border-orange-300 hover:text-orange-600 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Search size={16} /> <span className="hidden sm:inline">查詢訂單</span>
                    </Link>
                </header>

                {stores.length === 0 && (
                    <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl font-bold text-sm">
                        目前沒有可預定的分店，請稍後再試。
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* 菜單 */}
                    <main className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/70">
                            {selectedCategory ? (
                                <>
                                    <div className="mb-4 flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all shrink-0"
                                        >
                                            <ArrowLeft size={18} strokeWidth={3} />
                                        </button>
                                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></span>
                                            {selectedCategory.name}
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {selectedCategory.products.map(p => (
                                            <button key={p.id} onClick={() => setSelectedProduct(p)}
                                                className="group bg-slate-50 hover:bg-orange-50 active:scale-[0.98] p-3.5 rounded-xl border border-slate-100 hover:border-orange-200 transition-all text-left">
                                                <div className="font-black text-slate-800 group-hover:text-orange-600 mb-2 leading-snug line-clamp-2">{p.name}</div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-black text-slate-900">${p.base_price}</div>
                                                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-base font-black mb-3.5 text-slate-500 flex items-center gap-2">
                                        <Utensils size={18} className="text-orange-500" /> 請選擇分類
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {menu.map(cat => (
                                            <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                                                className="group relative bg-slate-50 hover:bg-orange-50 active:scale-[0.98] p-4 rounded-xl border border-slate-100 hover:border-orange-200 transition-all text-left overflow-hidden">
                                                <div className="font-black text-lg text-slate-800 group-hover:text-orange-600 leading-tight">{cat.name}</div>
                                                <div className="text-slate-400 font-bold text-xs mt-0.5">{cat.products.length} 項</div>
                                                <Utensils size={48} className="absolute -bottom-2 -right-2 opacity-[0.06]" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </main>

                    {/* 購物車 + 訂購資訊 */}
                    <aside ref={formRef} className="lg:col-span-1 space-y-3 lg:sticky lg:top-6 scroll-mt-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/70">
                            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                                <ShoppingCart size={16} className="text-orange-500" /> 點餐內容
                                {itemCount > 0 && <span className="text-orange-500">({itemCount})</span>}
                            </h2>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {cart.length === 0 && (
                                    <p className="text-slate-300 font-bold text-sm text-center py-1.5">尚未選擇餐點</p>
                                )}
                                {cart.map((item, i) => {
                                    const selectedOptions = item.options.filter(opt => item.selected_option_ids.includes(opt.id));
                                    return (
                                        <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="bg-white text-slate-600 px-1.5 h-6 rounded flex items-center text-xs font-black border border-slate-200 shrink-0 mt-0.5">
                                                {item.quantity}x
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-slate-800 text-sm leading-snug">{item.name}</div>
                                                {selectedOptions.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedOptions.map(opt => (
                                                            <span key={opt.id} className="bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-black text-orange-600">
                                                                {opt.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-black text-slate-900 text-sm">${item.total_unit_price * item.quantity}</div>
                                                <button
                                                    onClick={() => setCart(cart.filter((_, idx) => idx !== i))}
                                                    className="text-slate-300 hover:text-red-500 active:text-red-500 transition-colors mt-1 p-1 -mr-1"
                                                    aria-label="移除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-100">
                                <span className="text-slate-400 font-black text-xs uppercase tracking-wide">總金額</span>
                                <span className="text-xl font-black text-slate-900">
                                    <span className="text-sm text-orange-500 mr-0.5">$</span>{total}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/70 space-y-3">
                            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <User size={16} className="text-orange-500" /> 訂購人資訊
                            </h2>

                            <div>
                                <label className={labelClass}><Store size={12} /> 取餐分店 *</label>
                                <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass}>
                                    {stores.length === 0 && <option value="">無可用分店</option>}
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className={labelClass}><User size={12} /> 姓名 *</label>
                                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="王小明" autoComplete="name" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}><Phone size={12} /> 電話 *</label>
                                    <input type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="0912345678" autoComplete="tel" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}><Building2 size={12} /> 單位 (選填)</label>
                                <input type="text" value={customerUnit} onChange={(e) => setCustomerUnit(e.target.value)}
                                    placeholder="公司 / 學校 / 單位名稱" className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>取餐方式 *</label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button type="button" onClick={() => setOrderType('takeout')}
                                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${orderType === 'takeout' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                                        外帶自取
                                    </button>
                                    <button type="button" onClick={() => setOrderType('delivery')}
                                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${orderType === 'delivery' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                                        外送
                                    </button>
                                </div>
                            </div>

                            {orderType === 'delivery' && (
                                <div>
                                    <label className={labelClass}><MapPin size={12} /> 外送地址 *</label>
                                    <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2}
                                        placeholder="請填寫完整外送地址" autoComplete="street-address"
                                        className={`${inputClass} resize-none`} />
                                </div>
                            )}

                            <div>
                                <label className={labelClass}><Clock size={12} /> 預定取餐時間 (選填)</label>
                                <input type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={inputClass} />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 font-bold text-sm px-3 py-2 rounded-lg text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || cart.length === 0 || stores.length === 0}
                                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3 rounded-lg font-black shadow-lg shadow-orange-200 active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-400 transition-all flex items-center justify-center gap-1"
                            >
                                {submitting ? "送出中..." : <>送出預定 <ChevronRight size={16} strokeWidth={4} /></>}
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            {/* 手機底部固定結帳列 */}
            {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-400">已選 {itemCount} 項</div>
                        <div className="text-xl font-black text-slate-900 leading-tight">${total}</div>
                    </div>
                    <button
                        onClick={scrollToForm}
                        className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center gap-1"
                    >
                        填寫資料 <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>
            )}

            {selectedProduct && (
                <SelectionModal
                    compact
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onConfirm={confirmSelection}
                />
            )}

            {/* 預定成功：顯示訂單編號，不自動關閉 */}
            {submittedNo && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                                    <Check size={26} className="text-white stroke-[4]" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">預定成功！</h3>
                            <p className="text-slate-500 font-bold text-sm mt-1">門市將為您準備，請記下訂單編號</p>
                        </div>

                        <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5">訂單編號</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 text-4xl font-black text-slate-800 font-mono tracking-[0.2em]">{submittedNo}</div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard?.writeText(submittedNo);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-orange-600 active:scale-90 transition-all shrink-0"
                                    title="複製訂單編號"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <Link
                                to="/reserve/status"
                                className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                                <Search size={16} /> 查詢訂單狀態
                            </Link>
                            <button
                                onClick={() => setSubmittedNo("")}
                                className="w-full py-3 rounded-xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                繼續預定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservation;
