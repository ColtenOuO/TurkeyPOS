import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Edit2, Plus, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

interface ProductOption {
    name: string;
    price_delta: number;
    is_required: boolean;
}

interface Product {
    id: string;
    name: string;
    base_price: number;
    category_id: string;
    options: ProductOption[];
}

interface Category {
    id: string;
    name: string;
    products: Product[];
}

const ProductManagement: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formPrice, setFormPrice] = useState<string>("");
    const [formOptions, setFormOptions] = useState<ProductOption[]>([]);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await axios.get(`${API_BASE}/menu/`);
            setCategories(res.data);
        } catch (err) {
            console.error("Failed to fetch menu", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setFormPrice(product.base_price.toString());
        setFormOptions([...product.options]); // Clone options
        setIsModalOpen(true);
    };

    const handleOptionChange = (index: number, field: keyof ProductOption, value: any) => {
        const newOptions = [...formOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormOptions(newOptions);
    };

    const addOption = () => {
        setFormOptions([...formOptions, { name: "", price_delta: 0, is_required: false }]);
    };

    const removeOption = (index: number) => {
        const newOptions = [...formOptions];
        newOptions.splice(index, 1);
        setFormOptions(newOptions);
    };

    const handleSave = async () => {
        if (!editingProduct) return;

        try {
            const payload = {
                base_price: parseFloat(formPrice),
                options: formOptions
            };

            await axios.patch(`${API_BASE}/products/${editingProduct.name}`, payload);
            alert("更新成功！");
            setIsModalOpen(false);
            fetchMenu(); // Refresh data
        } catch (err) {
            console.error("Update failed", err);
            alert("更新失敗");
        }
    };

    if (loading) return <div className="p-8 font-black text-slate-400">載入中...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <header className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin')}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-3xl font-black text-slate-800">商品管理</h1>
            </header>

            <div className="space-y-8">
                {categories.map(category => (
                    <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-700">{category.name}</h2>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left">
                                <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-6 py-4">商品名稱</th>
                                        <th className="px-6 py-4">基礎價格</th>
                                        <th className="px-6 py-4">選項數量</th>
                                        <th className="px-6 py-4 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {category.products.map(product => (
                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{product.name}</td>
                                            <td className="px-6 py-4 font-bold text-slate-600">${product.base_price}</td>
                                            <td className="px-6 py-4 text-slate-500">{product.options.length}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditClick(product)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                    編輯
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-2xl font-black text-slate-800">編輯商品: {editingProduct.name}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">基礎價格</label>
                                <input
                                    type="number"
                                    value={formPrice}
                                    onChange={(e) => setFormPrice(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold text-slate-500">客製化選項</label>
                                    <button
                                        onClick={addOption}
                                        className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        <Plus size={16} /> 新增
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formOptions.map((opt, idx) => (
                                        <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <input
                                                type="text"
                                                placeholder="選項名稱"
                                                value={opt.name}
                                                onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-sm font-bold">+$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={opt.price_delta}
                                                    onChange={(e) => handleOptionChange(idx, 'price_delta', parseFloat(e.target.value))}
                                                    className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold"
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={opt.is_required}
                                                    onChange={(e) => handleOptionChange(idx, 'is_required', e.target.checked)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-100"
                                                />
                                                <span className="text-xs font-bold text-slate-500">必填</span>
                                            </label>
                                            <button
                                                onClick={() => removeOption(idx)}
                                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formOptions.length === 0 && (
                                        <div className="text-center py-6 text-slate-400 text-sm font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            此商品無客製化選項
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <Save size={20} />
                                儲存變更
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
