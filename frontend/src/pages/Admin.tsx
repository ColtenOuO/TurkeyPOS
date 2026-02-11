import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { LayoutDashboard, DollarSign, ShoppingBag, TrendingUp, Package, CalendarDays, Store } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

interface DashboardStats {
    today_revenue: number;
    today_orders: number;
    today_aov: number;
    total_revenue: number;
}

interface DailyTrend {
    date: string;
    revenue: number;
    count: number;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

const Admin: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch daily trend instead of hourly trend
                const [statsRes, trendRes, productsRes] = await Promise.all([
                    axios.get(`${API_BASE}/analytics/stats`),
                    axios.get(`${API_BASE}/analytics/daily-trend`), // Updated endpoint
                    axios.get(`${API_BASE}/analytics/top-products`)
                ]);
                setStats(statsRes.data);
                setDailyTrend(trendRes.data);
                setTopProducts(productsRes.data);
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-slate-400">
            載入管理後台中...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                    <LayoutDashboard size={40} className="text-blue-600" />
                    管理後台
                </h1>
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 font-bold ml-14 mt-1">每日銷售概況</p>
                    <div className="flex gap-3">
                        <a href="/admin/sales" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200">
                            <TrendingUp size={18} />
                            銷售報表
                        </a>
                        <a href="/admin/products" className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <Package size={18} />
                            管理商品
                        </a>
                        <a href="/admin/stores" className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg shadow-purple-200">
                            <Store size={18} />
                            分店管理
                        </a>
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
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">今日</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">
                        ${stats?.today_revenue.toLocaleString()}
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1">今日營收</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <ShoppingBag className="text-orange-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">今日</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">
                        {stats?.today_orders}
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1">今日訂單數</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">今日</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">
                        ${stats?.today_aov.toFixed(0)}
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1">平均客單價</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <DollarSign className="text-purple-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">累積</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">
                        ${stats?.total_revenue.toLocaleString()}
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1">總營收</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Daily Sales Trend Details */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <CalendarDays size={20} className="text-slate-400" />
                        銷售趨勢 (近30日)
                    </h3>
                    <div className="h-[300px]">
                        {dailyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(d) => d.slice(5)} // Show MM-DD
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(label) => `日期: ${label}`}
                                        formatter={(value: any) => [`$${value}`, "營收"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <TrendingUp size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">尚無過往銷售數據</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Package size={20} className="text-slate-400" />
                        熱銷商品排行
                    </h3>
                    <div className="h-[300px]">
                        {topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [value, "數量"]}
                                    />
                                    <Bar dataKey="quantity" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Package size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">尚無熱銷商品數據</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
