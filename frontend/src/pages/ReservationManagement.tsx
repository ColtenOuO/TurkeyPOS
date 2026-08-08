import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CalendarCheck, RefreshCw, Store, Phone, Building2, MapPin, Clock,
    CheckCircle2, ChefHat, XCircle, Trash2, Pencil, DollarSign, ShoppingBag, X
} from 'lucide-react';
import type { Reservation, ReservationSummary } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const STATUS_LABELS: Record<string, { text: string, className: string }> = {
    reserved: { text: '已預定', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    pending: { text: '製作中', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    completed: { text: '已完成', className: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { text: '已取消', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

/**
 * 後端訂單時間一律以 UTC+8 記錄，查詢日期必須用同一個基準。
 * 直接用 toISOString() 會取到 UTC 日期，台灣時間 00:00~08:00 之間會查不到當天訂單。
 */
export const todayTW = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];

const formatTime = (value: string | null) =>
    value ? new Date(value).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : null;

const ReservationManagement: React.FC = () => {
    const navigate = useNavigate();
    const [summaries, setSummaries] = useState<ReservationSummary[]>([]);
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [queryDate, setQueryDate] = useState(todayTW());
    const [selectedStore, setSelectedStore] = useState<string>("");
    const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
    const [editTarget, setEditTarget] = useState<Reservation | null>(null);

    const fetchSummaries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('start_date', queryDate);
            params.append('end_date', queryDate);
            if (selectedStore) params.append('store_id', selectedStore);

            const res = await axios.get<ReservationSummary[]>(`${API_BASE}/reservations/summary?${params.toString()}`);
            setSummaries(res.data);
        } catch (err) {
            console.error("Failed to fetch reservations", err);
        } finally {
            setLoading(false);
        }
    }, [queryDate, selectedStore]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await axios.get(`${API_BASE}/stores/`);
                setStores(res.data);
            } catch (e) {
                // 分店帳號可能無權限，忽略
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        fetchSummaries();
        const interval = setInterval(fetchSummaries, 30000);
        return () => clearInterval(interval);
    }, [fetchSummaries]);

    const updateReservation = async (id: string, payload: Record<string, any>) => {
        try {
            await axios.put(`${API_BASE}/reservations/${id}`, payload);
            await fetchSummaries();
            return true;
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail;
            alert(typeof detail === 'string' ? detail : "更新失敗");
            return false;
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_BASE}/reservations/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchSummaries();
        } catch (err) {
            console.error(err);
            alert("刪除失敗");
        }
    };

    // 全部分店合計 (已排除取消的訂單)
    const grandTotal = summaries.reduce((acc, s) => ({
        orders: acc.orders + s.total_orders,
        sales: acc.sales + s.total_sales,
        takeout: acc.takeout + s.takeout_orders,
        delivery: acc.delivery + s.delivery_orders,
    }), { orders: 0, sales: 0, takeout: 0, delivery: 0 });

    const visibleSummaries = summaries.filter(s => s.reservations.length > 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <header className="mb-8 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <CalendarCheck className="text-orange-600" /> 預定訂單
                        </h1>
                        <p className="text-slate-500 font-bold mt-1">依分店查看預定訂單，金額已計入銷售數據</p>
                    </div>
                </div>
                <button
                    onClick={fetchSummaries}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"
                    title="重新整理"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-wrap items-end gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">預定日期</label>
                    <input
                        type="date"
                        value={queryDate}
                        onChange={(e) => setQueryDate(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">分店篩選</label>
                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">所有分店</option>
                        {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setQueryDate(todayTW())}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                    今日
                </button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-200">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20} /></div>
                        <span className="font-bold">預定總金額</span>
                    </div>
                    <div className="text-4xl font-black">${grandTotal.sales.toLocaleString()}</div>
                    <div className="mt-3 text-sm font-medium opacity-80">已計入銷售報表</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><ShoppingBag size={20} /></div>
                        <span className="font-bold">預定訂單數</span>
                    </div>
                    <div className="text-4xl font-black text-slate-800">{grandTotal.orders}</div>
                    <div className="mt-3 text-sm font-bold text-slate-400">不含已取消</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><ShoppingBag size={20} /></div>
                        <span className="font-bold">外帶自取</span>
                    </div>
                    <div className="text-4xl font-black text-slate-800">{grandTotal.takeout}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><MapPin size={20} /></div>
                        <span className="font-bold">外送</span>
                    </div>
                    <div className="text-4xl font-black text-slate-800">{grandTotal.delivery}</div>
                </div>
            </div>

            {/* 依分店分類 */}
            {visibleSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    <CalendarCheck size={64} className="mb-4 opacity-20" />
                    <div className="text-xl font-black">此日期沒有預定訂單</div>
                </div>
            ) : (
                <div className="space-y-8">
                    {visibleSummaries.map(summary => (
                        <section key={summary.store_id || 'unknown'} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/60">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Store size={20} className="text-purple-600" />
                                    {summary.store_name || "未指定分店"}
                                </h3>
                                <div className="flex flex-wrap gap-6 text-sm font-bold">
                                    <span className="text-slate-500">訂單數 <span className="text-slate-800 text-lg ml-1">{summary.total_orders}</span></span>
                                    <span className="text-slate-500">外帶 <span className="text-slate-800 text-lg ml-1">{summary.takeout_orders}</span></span>
                                    <span className="text-slate-500">外送 <span className="text-slate-800 text-lg ml-1">{summary.delivery_orders}</span></span>
                                    <span className="text-slate-500">金額 <span className="text-orange-600 text-lg ml-1">${summary.total_sales.toLocaleString()}</span></span>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {summary.reservations.map(r => {
                                    const status = STATUS_LABELS[r.status] || { text: r.status, className: 'bg-slate-100 text-slate-500 border-slate-200' };
                                    return (
                                        <div key={r.id} className={`rounded-2xl border p-5 flex flex-col ${r.status === 'cancelled' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-mono font-black text-2xl text-orange-600 tracking-wider leading-none mb-1.5">
                                                        {r.order_no || "—"}
                                                    </div>
                                                    <div className="text-xl font-black text-slate-800">{r.customer_name}</div>
                                                    {r.customer_unit && (
                                                        <div className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1">
                                                            <Building2 size={14} /> {r.customer_unit}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${status.className}`}>
                                                    {status.text}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 text-sm font-bold text-slate-600 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <a href={`tel:${r.customer_phone}`} className="hover:text-orange-600">{r.customer_phone}</a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${r.order_type === 'delivery' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {r.order_type === 'delivery' ? '外送' : '外帶自取'}
                                                    </span>
                                                </div>
                                                {r.delivery_address && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                        <span className="leading-snug">{r.delivery_address}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {r.pickup_time
                                                        ? <span>取餐 {formatTime(r.pickup_time)}</span>
                                                        : <span className="text-slate-400">未指定取餐時間 (下單 {formatTime(r.created_at)})</span>}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2 mb-4 border-t border-slate-100 pt-3">
                                                {r.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="bg-slate-100 text-slate-600 px-2 h-6 rounded flex items-center text-xs font-black shrink-0">
                                                            {item.quantity}x
                                                        </span>
                                                        <div>
                                                            <div className="font-bold text-slate-800 leading-tight">{item.product_name}</div>
                                                            {item.selected_options.length > 0 && (
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {item.selected_options.map((opt, i) => (
                                                                        <span key={i} className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                                            {opt.option_name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 mb-4">
                                                <span className="text-slate-400 font-black text-sm">金額</span>
                                                <span className="text-2xl font-black text-slate-900">${r.total_price.toLocaleString()}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {r.status === 'reserved' && (
                                                    <button
                                                        onClick={() => updateReservation(r.id, { status: 'pending' })}
                                                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-95"
                                                    >
                                                        <ChefHat size={16} /> 確認並送廚房
                                                    </button>
                                                )}
                                                {(r.status === 'reserved' || r.status === 'pending') && (
                                                    <>
                                                        <button
                                                            onClick={() => updateReservation(r.id, { status: 'completed' })}
                                                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100 transition-all active:scale-95"
                                                        >
                                                            <CheckCircle2 size={16} /> 完成
                                                        </button>
                                                        <button
                                                            onClick={() => updateReservation(r.id, { status: 'cancelled' })}
                                                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                                        >
                                                            <XCircle size={16} /> 取消
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setEditTarget(r)}
                                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    <Pencil size={16} /> 編輯
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(r)}
                                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 size={16} /> 刪除
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {editTarget && (
                <EditReservationModal
                    reservation={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={async (payload) => {
                        const ok = await updateReservation(editTarget.id, payload);
                        if (ok) setEditTarget(null);
                    }}
                />
            )}

            {deleteTarget && (
                <ConfirmModal
                    message="確定要刪除此預定訂單？"
                    description={`${deleteTarget.customer_name} / $${deleteTarget.total_price}，此動作無法復原`}
                    confirmText="確認刪除"
                    cancelText="取消"
                    isDangerous
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};

interface EditModalProps {
    reservation: Reservation;
    onClose: () => void;
    onSave: (payload: Record<string, any>) => void;
}

const EditReservationModal: React.FC<EditModalProps> = ({ reservation, onClose, onSave }) => {
    const [name, setName] = useState(reservation.customer_name || "");
    const [unit, setUnit] = useState(reservation.customer_unit || "");
    const [phone, setPhone] = useState(reservation.customer_phone || "");
    const [orderType, setOrderType] = useState(reservation.order_type);
    const [address, setAddress] = useState(reservation.delivery_address || "");
    // datetime-local 需要 "YYYY-MM-DDTHH:mm" 格式
    const [pickupTime, setPickupTime] = useState(reservation.pickup_time ? reservation.pickup_time.slice(0, 16) : "");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!name.trim()) return setError("請填寫訂購人姓名");
        if (!phone.trim()) return setError("請填寫訂購人電話");
        if (orderType === 'delivery' && !address.trim()) return setError("外送訂單請填寫地址");

        onSave({
            customer_name: name.trim(),
            customer_unit: unit.trim() || null,
            customer_phone: phone.trim(),
            order_type: orderType,
            delivery_address: orderType === 'delivery' ? address.trim() : null,
            pickup_time: pickupTime || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-800">編輯預定訂單</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">訂購人姓名 *</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">單位</label>
                        <input value={unit} onChange={e => setUnit(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">訂購人電話 *</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">取餐方式 *</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button type="button" onClick={() => setOrderType('takeout')}
                                className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${orderType === 'takeout' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                                外帶自取
                            </button>
                            <button type="button" onClick={() => setOrderType('delivery')}
                                className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${orderType === 'delivery' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                                外送
                            </button>
                        </div>
                    </div>
                    {orderType === 'delivery' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">外送地址 *</label>
                            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">預定取餐時間</label>
                        <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 font-bold text-sm px-4 py-3 rounded-xl text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                        取消
                    </button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-black text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-95">
                        儲存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReservationManagement;
