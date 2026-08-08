
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Trash2, Clock, ChefHat, LogOut, CalendarCheck, Phone, MapPin, Building2, XCircle } from 'lucide-react';
import type { Order, Reservation } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

/** 以 UTC+8 為基準的日期字串 (後端訂單時間也是 UTC+8) */
const daysFromTW = (offset: number) =>
    new Date(Date.now() + (8 * 60 + offset * 24 * 60) * 60 * 1000).toISOString().split('T')[0];

const Kitchen: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [completingIds, setCompletingIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
    const [storeName, setStoreName] = useState<string>("");

    const fetchOrders = async () => {
        try {
            // 待製作訂單 + 尚未確認的預定訂單 (分店 token 只會拿到自己的)
            // 刻意不套用「今日」預設：未確認的單不論日期都要看得到，跨日或預約未來日期都不能漏
            const [orderRes, reservationRes] = await Promise.all([
                axios.get<Order[]>(`${API_BASE}/orders/active`),
                axios.get<Reservation[]>(`${API_BASE}/reservations/?status=reserved&start_date=${daysFromTW(-7)}&end_date=${daysFromTW(30)}`),
            ]);
            setOrders(orderRes.data);
            setReservations(reservationRes.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    /** 確認預定訂單 → 轉為 pending，進入下方待製作區 */
    const handleAcceptReservation = async (id: string) => {
        try {
            await axios.put(`${API_BASE}/reservations/${id}`, { status: 'pending' });
            fetchOrders();
        } catch (err) {
            console.error(err);
            alert("確認預定訂單失敗");
        }
    };

    /** 拒絕/取消預定訂單 → 轉為 cancelled，顧客查詢頁會顯示已取消，且不計入銷售 */
    const cancelReservation = async (id: string, onDone: () => void) => {
        try {
            await axios.put(`${API_BASE}/reservations/${id}`, { status: 'cancelled' });
            onDone();
            fetchOrders();
        } catch (err) {
            console.error(err);
            alert("取消預定訂單失敗");
        }
    };

    const confirmReject = () => rejectTarget && cancelReservation(rejectTarget.id, () => setRejectTarget(null));
    const confirmCancel = () => cancelTarget && cancelReservation(cancelTarget.id, () => setCancelTarget(null));

    useEffect(() => {
        // Get store name from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Simple decode to get store_name
                const payload = JSON.parse(atob(token.split('.')[1]));
                setStoreName(payload.store_name || "Unknown Store");
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }

        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds

        // Clock timer
        const timer = setInterval(() => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
            setCurrentTime(`${dateStr} ${timeStr}`);
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, []);

    const handleComplete = async (id: string) => {
        setCompletingIds(prev => [...prev, id]);

        // Wait for animation
        setTimeout(async () => {
            try {
                await axios.patch(`${API_BASE}/orders/${id}/status`, { status: 'completed' });
                setOrders(prev => prev.filter(o => o.id !== id));
            } catch (err) {
                console.error(err);
                alert("Failed to update order status");
                setCompletingIds(prev => prev.filter(pid => pid !== id));
            }
        }, 500); // 500ms animation duration
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_BASE}/orders/${deleteId}`);
            setOrders(prev => prev.filter(o => o.id !== deleteId));
            setDeleteId(null);
        } catch (err) {
            console.error(err);
            alert("Failed to delete order");
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-orange-500 text-xl">
            載入訂單中... (Loading Orders)
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <header className="mb-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center border-2 border-orange-200 shadow-sm">
                        <ChefHat size={48} className="text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-slate-800 tracking-tight">
                            {storeName || "廚房系統"}
                        </h1>
                        <div className="text-slate-400 font-bold tracking-widest text-lg uppercase mt-2 flex items-center gap-2">
                            廚房接單系統 <span className="text-slate-300">|</span> KITCHEN DISPLAY
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-3xl font-black text-slate-400 font-mono tracking-widest">
                        {currentTime}
                    </div>
                    <div className="bg-white px-6 py-3 rounded-xl font-black text-slate-700 shadow-sm border border-slate-200">
                        待製作: <span className="text-orange-600 text-xl">{orders.length}</span>
                    </div>
                    {reservations.length > 0 && (
                        <div className="bg-amber-50 px-6 py-3 rounded-xl font-black text-amber-700 shadow-sm border border-amber-200">
                            待確認預定: <span className="text-xl">{reservations.length}</span>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.href = "/"}
                        className="px-4 py-3 bg-white text-slate-600 rounded-xl shadow-md font-bold hover:bg-slate-50 transition-colors border border-slate-200"
                    >
                        回到點餐
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("確定要登出廚房系統嗎？")) {
                                localStorage.removeItem('token');
                                window.location.href = "/store-login";
                            }
                        }}
                        className="p-3 bg-white rounded-xl shadow-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-200"
                        title="登出"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </header>

            {/* 今日預定訂單：尚未確認，確認後才進入待製作區 */}
            {reservations.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-black text-slate-700 flex items-center gap-3 mb-5">
                        <CalendarCheck className="text-amber-600" size={28} />
                        今日預定訂單
                        <span className="bg-amber-100 text-amber-700 px-3 py-0.5 rounded-full text-lg border border-amber-200">
                            {reservations.length}
                        </span>
                        <span className="text-slate-400 font-bold text-base">確認後才會進入下方待製作區</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reservations.map(r => (
                            <div key={r.id} className="bg-amber-50/60 rounded-[2rem] p-6 shadow-lg border-2 border-amber-200 flex flex-col">
                                <div className="flex justify-between items-start mb-4 pb-3 border-b border-amber-200">
                                    <div>
                                        <div className="text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">訂單編號</div>
                                        <div className="text-3xl font-black text-slate-800 font-mono">{r.order_no || "—"}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${r.order_type === 'delivery' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                        {r.order_type === 'delivery' ? '外送' : '外帶自取'}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-sm font-bold text-slate-600 mb-4">
                                    <div className="text-lg font-black text-slate-800">{r.customer_name}</div>
                                    {r.customer_unit && (
                                        <div className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400" /> {r.customer_unit}</div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <Phone size={14} className="text-slate-400" />
                                        <a href={`tel:${r.customer_phone}`} className="hover:text-orange-600">{r.customer_phone}</a>
                                    </div>
                                    {r.delivery_address && (
                                        <div className="flex items-start gap-1.5">
                                            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                            <span className="leading-snug">{r.delivery_address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-amber-700">
                                        <Clock size={14} />
                                        {r.pickup_time
                                            ? `取餐 ${new Date(r.pickup_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}`
                                            : "未指定取餐時間"}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2 mb-4">
                                    {r.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="bg-white text-slate-600 px-1.5 h-6 rounded flex items-center text-xs font-black shrink-0 border border-amber-200">
                                                {item.quantity}x
                                            </span>
                                            <div>
                                                <div className="font-bold text-slate-800 leading-tight">{item.product_name}</div>
                                                {item.selected_options.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {item.selected_options.map((opt, i) => (
                                                            <span key={i} className="text-[10px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-100">
                                                                {opt.option_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mb-4 pt-3 border-t border-amber-200">
                                    <span className="text-slate-400 font-black text-xs uppercase">金額</span>
                                    <span className="text-2xl font-black text-slate-900">${r.total_price}</span>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleAcceptReservation(r.id)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95"
                                    >
                                        <ChefHat size={18} /> 接單並開始製作
                                    </button>
                                    <button
                                        onClick={() => setRejectTarget(r)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-colors"
                                    >
                                        <XCircle size={16} /> 拒絕訂單
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {orders.length === 0 && reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                    <CheckCircle2 size={64} className="mb-4 opacity-50" />
                    <div className="text-2xl font-black">目前沒有訂單</div>
                    <div className="font-medium mt-2">休息一下吧！</div>
                </div>
            ) : orders.length === 0 ? null : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order.id}
                            className={`bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200 flex flex-col hover:shadow-2xl transition-all duration-500 ${order.is_reservation ? 'border-2 border-amber-300' : 'border border-white'} ${completingIds.includes(order.id) ? 'opacity-0 scale-90 translate-y-10' : 'opacity-100 scale-100'}`}>
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100" >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            {order.is_reservation ? '訂單編號 (Order No.)' : '桌號 (Table)'}
                                        </div>
                                        {order.is_reservation && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-300">
                                                預訂單
                                            </span>
                                        )}
                                        {!order.is_reservation && order.order_type === 'takeout' && (
                                            <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                                                外帶
                                            </span>
                                        )}
                                    </div>
                                    <div className={`text-3xl font-black text-slate-800 ${order.is_reservation ? 'font-mono tracking-wider' : ''}`}>
                                        {order.is_reservation
                                            ? (order.order_no || "—")
                                            : (order.table_number === 'Takeout' ? '外帶' : (order.table_number || "N/A"))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                                        {order.is_reservation && order.pickup_time ? '取餐時間' : '時間 (Time)'}
                                    </div>
                                    <div className="text-sm font-bold text-slate-600 flex items-center gap-1 justify-end">
                                        <Clock size={14} />
                                        {new Date(order.is_reservation && order.pickup_time ? order.pickup_time : order.created_at)
                                            .toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                </div>
                            </div>

                            {/* 預訂單：補上取餐人資訊 */}
                            {order.is_reservation && (
                                <div className="mb-4 pb-4 border-b border-slate-100 space-y-1 text-sm font-bold text-slate-600">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-base font-black text-slate-800">{order.customer_name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${order.order_type === 'delivery' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                                            {order.order_type === 'delivery' ? '外送' : '外帶自取'}
                                        </span>
                                    </div>
                                    {order.customer_unit && (
                                        <div className="flex items-center gap-1.5"><Building2 size={13} className="text-slate-400" /> {order.customer_unit}</div>
                                    )}
                                    {order.customer_phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" />
                                            <a href={`tel:${order.customer_phone}`} className="hover:text-orange-600">{order.customer_phone}</a>
                                        </div>
                                    )}
                                    {order.delivery_address && (
                                        <div className="flex items-start gap-1.5">
                                            <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                            <span className="leading-snug">{order.delivery_address}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 space-y-4 mb-8 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start group">
                                        <div className="flex items-start gap-3">
                                            <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
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
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                {order.is_reservation ? (
                                    // 預訂單改為「取消」而非刪除：顧客憑編號查詢時才看得到「已取消」
                                    <button
                                        onClick={() => setCancelTarget(order)}
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"
                                    >
                                        <XCircle size={18} /> 取消訂單
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setDeleteId(order.id)}
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={18} /> 刪除
                                    </button>
                                )}
                                <button
                                    onClick={() => handleComplete(order.id)}
                                    disabled={completingIds.includes(order.id)}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <CheckCircle2 size={18} /> 完成
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {cancelTarget && (
                <ConfirmModal
                    message="確定要取消這筆預定訂單？"
                    description={`編號 ${cancelTarget.order_no || '—'}・${cancelTarget.customer_name}・$${cancelTarget.total_price}。顧客查詢時會看到「已取消」，此筆不計入銷售數據。`}
                    confirmText="確認取消"
                    cancelText="返回"
                    isDangerous={true}
                    onConfirm={confirmCancel}
                    onCancel={() => setCancelTarget(null)}
                />
            )}

            {rejectTarget && (
                <ConfirmModal
                    message="確定要拒絕這筆預定訂單？"
                    description={`編號 ${rejectTarget.order_no || '—'}・${rejectTarget.customer_name}・$${rejectTarget.total_price}。顧客查詢時會看到「已取消」，此筆不計入銷售數據。建議先電話告知顧客。`}
                    confirmText="確認拒絕"
                    cancelText="返回"
                    isDangerous={true}
                    onConfirm={confirmReject}
                    onCancel={() => setRejectTarget(null)}
                />
            )}

            {deleteId && (
                <ConfirmModal
                    message="確定要刪除此訂單？"
                    description="此動作無法復原"
                    confirmText="確認刪除"
                    cancelText="取消"
                    isDangerous={true}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteId(null)}
                />
            )}
        </div>
    );
};

export default Kitchen;
