
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Plus, Trash2, ArrowLeft, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

interface StoreData {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

const StoreManagement: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newStoreName, setNewStoreName] = useState("");
    const [newStorePassword, setNewStorePassword] = useState("");

    const fetchStores = async () => {
        try {
            const res = await axios.get(`${API_BASE}/stores/`);
            setStores(res.data);
        } catch (err) {
            console.error("Failed to fetch stores", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/stores/`, {
                name: newStoreName,
                password: newStorePassword
            });
            setShowAddModal(false);
            setNewStoreName("");
            setNewStorePassword("");
            fetchStores();
        } catch (err) {
            alert("新增分店失敗 (可能名稱重複)");
        }
    };

    const handleDeleteStore = async (id: string) => {
        if (!confirm("確定要刪除此分店嗎？")) return;
        try {
            await axios.delete(`${API_BASE}/stores/${id}`);
            fetchStores();
        } catch (err) {
            console.error("Delete failed", err);
            alert("刪除失敗");
        }
    };

    const handleResetPassword = async (id: string) => {
        const newPassword = prompt("請輸入新密碼：");
        if (!newPassword) return;

        try {
            await axios.put(`${API_BASE}/stores/${id}/reset-password`, {
                password: newPassword
            });
            alert("密碼已重置");
        } catch (err) {
            alert("重置密碼失敗");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-2"
                    >
                        <ArrowLeft size={20} />
                        返回總覽
                    </button>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                        <Store size={40} className="text-purple-600" />
                        分店管理
                    </h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    新增分店
                </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 font-black text-slate-600">分店名稱</th>
                            <th className="p-6 font-black text-slate-600">狀態</th>
                            <th className="p-6 font-black text-slate-600">建立時間</th>
                            <th className="p-6 font-black text-slate-600 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map((store) => (
                            <tr key={store.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="p-6 font-bold text-slate-800">{store.name}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.is_active ? '營業中' : '已停用'}
                                    </span>
                                </td>
                                <td className="p-6 font-medium text-slate-500">
                                    {new Date(store.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <button
                                        onClick={() => handleResetPassword(store.id)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="重置密碼"
                                    >
                                        <KeyRound size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="刪除"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {stores.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">
                                    尚無分店資料
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">新增分店</h2>
                        <form onSubmit={handleAddStore} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">分店名稱</label>
                                <input
                                    type="text"
                                    value={newStoreName}
                                    onChange={(e) => setNewStoreName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="例如：安琪店"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">登入密碼</label>
                                <input
                                    type="password"
                                    value={newStorePassword}
                                    onChange={(e) => setNewStorePassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="設定分店密碼"
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    新增
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;
