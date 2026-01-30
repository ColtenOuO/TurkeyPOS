
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Trash2, Clock, ChefHat } from 'lucide-react';
import type { Order } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const Kitchen: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [completingIds, setCompletingIds] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await axios.get<Order[]>(`${API_BASE}/orders/active`);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
            LOADING ORDERS...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                        <ChefHat size={40} className="text-orange-600" />
                        Kitchen Display
                    </h1>
                    <p className="text-slate-500 font-bold ml-14 mt-1 tracking-widest text-sm uppercase">Pending Orders</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-3xl font-black text-slate-400 font-mono tracking-widest">
                        {currentTime}
                    </div>
                    <div className="bg-white px-6 py-3 rounded-xl font-black text-slate-700 shadow-sm border border-slate-200">
                        Active Orders: <span className="text-orange-600 text-xl">{orders.length}</span>
                    </div>
                </div>
            </header>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                    <CheckCircle2 size={64} className="mb-4 opacity-50" />
                    <div className="text-2xl font-black">All Caught Up!</div>
                    <div className="font-medium mt-2">No pending orders at the moment.</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div key={order.id}
                            className={`bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200 border border-white flex flex-col hover:shadow-2xl transition-all duration-500 ${completingIds.includes(order.id) ? 'opacity-0 scale-90 translate-y-10' : 'opacity-100 scale-100'}`}>
                            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100" >
                                <div>
                                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Table</div>
                                    <div className="text-3xl font-black text-slate-800">{order.table_number || "N/A"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Time</div>
                                    <div className="text-sm font-bold text-slate-600 flex items-center gap-1 justify-end">
                                        <Clock size={14} />
                                        {new Date(order.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                </div>
                            </div>

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
                                <button
                                    onClick={() => setDeleteId(order.id)}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={18} /> 刪除
                                </button>
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
