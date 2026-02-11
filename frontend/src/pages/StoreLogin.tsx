
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Store, Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const StoreLogin: React.FC = () => {
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);

    React.useEffect(() => {
        const checkStores = async () => {
            try {
                // Now public
                const res = await axios.get(`${API_BASE}/stores/`);
                setStores(res.data);

                // Pre-select the first store if available
                if (res.data.length > 0) {
                    setStoreName(res.data[0].name);
                }
            } catch (err) {
                console.error("Failed to check stores", err);
            }
        };
        checkStores();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.append('username', storeName);
            params.append('password', password);

            const res = await axios.post(`${API_BASE}/login/store`, params);

            // Save token
            localStorage.setItem('token', res.data.access_token);

            // Redirect to POS (Home)
            navigate('/');
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || "登入失敗，請檢查分店名稱或密碼");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
                        <Store className="text-purple-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">分店登入</h1>
                    <p className="text-slate-500 font-bold mt-2">請選擇分店並輸入密碼</p>
                </div>

                {stores.length === 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl font-bold text-center text-sm">
                        目前沒有分店，請先至管理員介面設定。
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">選擇分店</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                                required
                            >
                                {stores.length === 0 && <option value="">無可用分店</option>}
                                {stores.map((store) => (
                                    <option key={store.id} value={store.name}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">密碼</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="輸入分店密碼"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading || stores.length === 0}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? "驗證中..." : "登入分店系統"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            返回管理員登入
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoreLogin;
