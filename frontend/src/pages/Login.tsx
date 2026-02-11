import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.append('username', 'admin'); // Required by OAuth2PasswordRequestForm
            params.append('password', password);

            const res = await axios.post(`${API_BASE}/login/access-token`, params);

            // Save token
            localStorage.setItem('token', res.data.access_token);

            // Redirect to admin
            navigate('/admin');
        } catch (err) {
            console.error("Login failed", err);
            setError("密碼錯誤，請重試");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">管理員登入</h1>
                    <p className="text-slate-500 font-bold mt-2">請輸入密碼以存取後台</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">密碼</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="請輸入後台密碼"
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
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? "驗證中..." : "登入系統"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/store-login')}
                            className="w-full py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            回到分店登入頁面
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
