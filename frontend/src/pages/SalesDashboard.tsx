import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Calendar, Search, DollarSign, ShoppingBag, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

interface SalesStats {
    period: {
        start: string | null;
        end: string | null;
    };
    stats: {
        total_orders: number;
        total_sales: number;
        avg_order_value: number;
    };
    products?: {
        name: string;
        quantity: number;
        revenue: number;
    }[];
}

const SalesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [overview, setOverview] = useState<any[] | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Filter States
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isOverall, setIsOverall] = useState(false);

    // Store Filter
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>("");

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Fetch stores
        const fetchStores = async () => {
            try {
                const res = await axios.get(`${API_BASE}/stores/`);
                setStores(res.data);
            } catch (e) {
                // Ignore if not admin or fails
            }
        };
        fetchStores();

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchSalesStats();
    }, [isOverall, selectedStore]); // Fetch when filter mode changes

    const fetchSalesStats = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/sales/stats`;
            let overviewUrl = `${API_BASE}/sales/overview`; // New endpoint
            const params = new URLSearchParams();

            if (!isOverall) {
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
            }

            if (selectedStore) {
                params.append('store_id', selectedStore);
            }

            const res = await axios.get(`${url}?${params.toString()}`);
            setStats(res.data);

            // Fetch overview only if we are viewing all stores
            if (!selectedStore) {
                const resOverview = await axios.get(`${overviewUrl}?${params.toString()}`);
                setOverview(resOverview.data);
            } else {
                setOverview(null);
            }

        } catch (err) {
            console.error("Failed to fetch sales stats", err);
            // alert("無法載入銷售數據");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setIsOverall(false);
        fetchSalesStats();
    };

    const handleOverall = () => {
        setIsOverall(true);
        setStartDate("");
        setEndDate("");
    };

    const handleToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setIsOverall(false);
        // After state update, fetch will be triggered if we add it to dependency or call manually
        // But setState is async, so handleSearch logic duplicated here or use effect
        // Simplest: just set state and let user click search, OR calling fetch with new values
        setTimeout(() => fetchSalesStats(), 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <header className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <TrendingUp className="text-blue-600" /> 銷售報表
                        </h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                            <Clock size={16} />
                            {currentTime.toLocaleString('zh-TW', { hour12: false })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchSalesStats}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"
                        title="重新整理"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("確定要登出嗎？")) {
                                localStorage.removeItem('token');
                                window.location.href = "/login";
                            }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        登出
                    </button>
                </div>
            </header>

            {/* Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="flex flex-wrap items-end gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">開始日期</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setIsOverall(false); }}
                                disabled={isOverall}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">結束日期</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setIsOverall(false); }}
                                disabled={isOverall}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={isOverall || loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Search size={18} /> 查詢區間
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            今日
                        </button>
                        <button
                            onClick={handleOverall}
                            className={`px-4 py-2.5 rounded-xl font-bold transition-colors border ${isOverall ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            全時期數據
                        </button>
                    </div>
                </div>

                {stores.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-500 mb-2">分店篩選</label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="w-full md:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">所有分店</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <span className="font-bold">總銷售額</span>
                    </div>
                    <div className="text-4xl font-black">
                        ${stats?.stats.total_sales.toLocaleString() || 0}
                    </div>
                    <div className="mt-4 text-sm font-medium opacity-70">
                        {isOverall ? "所有時期累積" : `${startDate || '?'} ~ ${endDate || '?'}`}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="font-bold">總訂單數</span>
                    </div>
                    <div className="text-4xl font-black text-slate-800">
                        {stats?.stats.total_orders.toLocaleString() || 0}
                    </div>
                    <div className="mt-4 text-sm font-bold text-slate-400">
                        筆訂單完成
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <span className="font-bold">平均客單價</span>
                    </div>
                    <div className="text-4xl font-black text-slate-800">
                        ${stats?.stats.avg_order_value.toLocaleString() || 0}
                    </div>
                    <div className="mt-4 text-sm font-bold text-slate-400">
                        每筆平均消費
                    </div>
                </div>
            </div>


            {/* Store Overview Cards */}
            {
                (isOverall || !selectedStore) && overview && overview.length > 0 ? (
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                            <ShoppingBag className="text-blue-600" size={24} />
                            各分店營運概況
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {overview.map((store) => (
                                <div key={store.store_id} className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all ${store.is_active ? 'border-slate-100' : 'border-red-100 bg-red-50/50'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-black text-xl text-slate-800">{store.store_name}</div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {store.is_active ? '營業中' : '停用'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-sm font-bold text-slate-400 mb-1">訂單數</div>
                                            <div className="text-2xl font-black text-slate-800">{store.total_orders}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-slate-400 mb-1">銷售額</div>
                                            <div className="text-2xl font-black text-blue-600">${store.total_sales.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null
            }

            {/* Product Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="text-blue-600" size={24} />
                        各項商品銷售統計
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">商品名稱</th>
                                <th className="px-6 py-4 text-right">銷售數量</th>
                                <th className="px-6 py-4 text-right">銷售總額</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats?.products && stats.products.length > 0 ? (
                                stats.products.map((product, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{product.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-600">{product.quantity}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-600">${product.revenue.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-bold italic">
                                        尚無銷售數據
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default SalesDashboard;
