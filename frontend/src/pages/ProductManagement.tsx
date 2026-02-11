import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Edit2, Plus, Trash2, Save, X, FolderPlus, Settings, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

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

interface CategoryCreate {
    name: string;
    sort_order: number;
}

const ProductManagement: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState<string>("");

    // Reorder Modal States
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [reorderData, setReorderData] = useState<Category[]>([]);
    const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

    // Trash Modal States
    const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
    const [trashData, setTrashData] = useState<{ categories: Category[], products: Product[] }>({ categories: [], products: [] });

    // Form States
    const [catForm, setCatForm] = useState<CategoryCreate>({ name: "", sort_order: 0 });

    const [formName, setFormName] = useState("");
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

    const openReorderModal = () => {
        setReorderData(JSON.parse(JSON.stringify(categories))); // Deep copy
        setIsReorderModalOpen(true);
    };

    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const newData = [...reorderData];
        if (direction === 'up' && index > 0) {
            [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
        } else if (direction === 'down' && index < newData.length - 1) {
            [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
        }
        setReorderData(newData);
    };

    const handleMoveProduct = (catIndex: number, prodIndex: number, direction: 'up' | 'down') => {
        const newData = [...reorderData];
        const products = newData[catIndex].products;
        if (direction === 'up' && prodIndex > 0) {
            [products[prodIndex], products[prodIndex - 1]] = [products[prodIndex - 1], products[prodIndex]];
        } else if (direction === 'down' && prodIndex < products.length - 1) {
            [products[prodIndex], products[prodIndex + 1]] = [products[prodIndex + 1], products[prodIndex]];
        }
        setReorderData(newData);
    };

    const saveReorder = async () => {
        try {
            // Save Categories Order
            const catPayload = {
                items: reorderData.map((cat, idx) => ({ id: cat.id, sort_order: idx }))
            };
            await axios.put(`${API_BASE}/menu/reorder`, catPayload);

            // Save Products Order (for all categories)
            const prodItems: { id: string, sort_order: number }[] = [];
            reorderData.forEach(cat => {
                cat.products.forEach((prod, idx) => {
                    prodItems.push({ id: prod.id, sort_order: idx });
                });
            });

            if (prodItems.length > 0) {
                await axios.put(`${API_BASE}/products/reorder`, { items: prodItems });
            }

            alert("排序更新成功！");
            setIsReorderModalOpen(false);
            fetchMenu();
        } catch (err) {
            console.error("Reorder failed", err);
            alert("排序更新失敗");
        }
    };

    const openTrashModal = async () => {
        try {
            const res = await axios.get(`${API_BASE}/menu/trash`);
            setTrashData(res.data);
            setIsTrashModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch trash", err);
            alert("無法載入回收桶");
        }
    };

    const handleRestore = async (type: 'category' | 'product', id: string) => {
        try {
            const endpoint = type === 'category' ? `menu/categories/${id}/restore` : `products/${id}/restore`;
            await axios.post(`${API_BASE}/${endpoint}`);

            // Refresh trash data
            const res = await axios.get(`${API_BASE}/menu/trash`);
            setTrashData(res.data);
            fetchMenu(); // Refresh main menu
        } catch (err) {
            console.error("Restore failed", err);
            alert("復原失敗");
        }
    };

    const handleHardDelete = async (type: 'category' | 'product', id: string) => {
        if (!confirm("確定要永久刪除嗎？此操作無法復原！")) return;
        try {
            const endpoint = type === 'category' ? `menu/categories/${id}/hard` : `products/${id}/hard`;
            await axios.delete(`${API_BASE}/${endpoint}`);

            // Refresh trash data
            const res = await axios.get(`${API_BASE}/menu/trash`);
            setTrashData(res.data);
        } catch (err) {
            console.error("Hard delete failed", err);
            alert("永久刪除失敗");
        }
    };

    // --- Actions ---

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setFormPrice(product.base_price.toString());
        setFormOptions([...product.options]); // Clone options
        setIsEditModalOpen(true);
    };

    const openAddProductModal = (categoryId: string) => {
        setTargetCategoryId(categoryId);
        setFormName("");
        setFormPrice("");
        setFormOptions([]);
        setIsProductAddModalOpen(true);
    };

    // --- Form Handling ---

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

    // --- API Calls ---

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        try {
            const payload = {
                base_price: parseFloat(formPrice),
                options: formOptions
            };
            await axios.patch(`${API_BASE}/products/${editingProduct.name}`, payload);
            alert("更新成功！");
            setIsEditModalOpen(false);
            fetchMenu();
        } catch (err) {
            console.error("Update failed", err);
            alert("更新失敗");
        }
    };

    const handleAddCategory = async () => {
        try {
            await axios.post(`${API_BASE}/menu/categories`, catForm);
            alert("分類新增成功！");
            setIsCatModalOpen(false);
            setCatForm({ name: "", sort_order: 0 });
            fetchMenu();
        } catch (err) {
            console.error("Add category failed", err);
            alert("新增分類失敗");
        }
    };

    const handleAddProduct = async () => {
        if (!formName || !formPrice) {
            alert("請填寫名稱與價格");
            return;
        }
        try {
            const payload = {
                name: formName,
                base_price: parseFloat(formPrice),
                category_id: targetCategoryId,
                options: formOptions
            };
            await axios.post(`${API_BASE}/products/`, payload);
            alert("商品新增成功！");
            setIsProductAddModalOpen(false);
            fetchMenu();
        } catch (err) {
            console.error("Add product failed", err);
            alert("新增商品失敗");
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm("確定要刪除此分類嗎？包含的商品將無法在菜單上顯示。")) return;
        try {
            await axios.delete(`${API_BASE}/menu/categories/${categoryId}`);
            alert("分類已刪除");
            fetchMenu();
        } catch (err) {
            console.error("Delete category failed", err);
            alert("刪除分類失敗");
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("確定要刪除此商品嗎？")) return;
        try {
            await axios.delete(`${API_BASE}/products/${productId}`);
            alert("商品已刪除");
            fetchMenu();
        } catch (err) {
            console.error("Delete product failed", err);
            alert("刪除商品失敗");
        }
    };

    // --- Render Helpers ---

    const renderOptionForm = () => (
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
            </div>
        </div>
    );

    if (loading) return <div className="p-8 font-black text-slate-400">載入中...</div>;

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
                    <h1 className="text-3xl font-black text-slate-800">商品管理</h1>
                </div>
                <button
                    onClick={() => setIsCatModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
                >
                    <FolderPlus size={18} />
                    新增分類
                </button>
                <button
                    onClick={openReorderModal}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                >
                    <Settings size={18} />
                    設定排序
                </button>
                <button
                    onClick={openTrashModal}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-colors"
                >
                    <Trash2 size={18} />
                    回收桶
                </button>
                <button
                    onClick={() => {
                        if (confirm("確定要登出嗎？")) {
                            localStorage.removeItem('token');
                            window.location.href = "/login";
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                    登出
                </button>
            </header>

            <div className="space-y-8">
                {categories.map(category => (
                    <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-700">{category.name}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-sm font-bold text-red-500 flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} /> 刪除分類
                                </button>
                                <button
                                    onClick={() => openAddProductModal(category.id)}
                                    className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={16} /> 新增商品
                                </button>
                            </div>
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
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(product)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                    編輯
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    刪除
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

            {/* Edit Product Modal */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-2xl font-black text-slate-800">編輯商品: {editingProduct.name}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                            {renderOptionForm()}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">取消</button>
                            <button onClick={handleSaveEdit} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95">
                                <Save size={20} /> 儲存變更
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800">新增分類</h3>
                            <button onClick={() => setIsCatModalOpen(false)}><X size={24} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">分類名稱</label>
                                <input
                                    type="text"
                                    value={catForm.name}
                                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                                />
                            </div>
                            {/* Removed manual Sort Order input as requested */}
                        </div>
                        <div className="p-6 flex justify-end gap-3">
                            <button onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100">取消</button>
                            <button onClick={handleAddCategory} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">新增</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isProductAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-2xl font-black text-slate-800">新增商品</h3>
                            <button onClick={() => setIsProductAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">商品名稱</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">基礎價格</label>
                                <input
                                    type="number"
                                    value={formPrice}
                                    onChange={(e) => setFormPrice(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                                />
                            </div>
                            {renderOptionForm()}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-end gap-3">
                            <button onClick={() => setIsProductAddModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200">取消</button>
                            <button onClick={handleAddProduct} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95">
                                <Plus size={20} /> 新增商品
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reorder Modal */}
            {isReorderModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <h3 className="text-2xl font-black text-slate-800">調整排序</h3>
                            <button onClick={() => setIsReorderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                            <div className="space-y-4">
                                {reorderData.map((cat, catIdx) => (
                                    <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
                                                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                                >
                                                    {expandedCatId === cat.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                <span className="font-bold text-slate-700">{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleMoveCategory(catIdx, 'up')}
                                                    disabled={catIdx === 0}
                                                    className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg"
                                                >
                                                    <ArrowUp size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveCategory(catIdx, 'down')}
                                                    disabled={catIdx === reorderData.length - 1}
                                                    className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg"
                                                >
                                                    <ArrowDown size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedCatId === cat.id && (
                                            <div className="border-t border-slate-100 divide-y divide-slate-50">
                                                {cat.products.map((prod, prodIdx) => (
                                                    <div key={prod.id} className="flex items-center justify-between p-3 pl-12 hover:bg-slate-50">
                                                        <span className="text-slate-600 font-medium">{prod.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleMoveProduct(catIdx, prodIdx, 'up')}
                                                                disabled={prodIdx === 0}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded"
                                                            >
                                                                <ArrowUp size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveProduct(catIdx, prodIdx, 'down')}
                                                                disabled={prodIdx === cat.products.length - 1}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded"
                                                            >
                                                                <ArrowDown size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {cat.products.length === 0 && (
                                                    <div className="p-4 text-center text-slate-400 text-sm italic">此分類無商品</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 flex justify-end gap-3">
                            <button onClick={() => setIsReorderModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">取消</button>
                            <button onClick={saveReorder} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95">
                                <Save size={20} /> 儲存排序
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Trash Modal */}
            {isTrashModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <Trash2 className="text-red-500" /> 回收桶
                            </h3>
                            <button onClick={() => setIsTrashModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Deleted Categories */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">已刪除分類</h4>
                                {trashData.categories.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm">無已刪除分類</p>
                                ) : (
                                    trashData.categories.map(cat => (
                                        <div key={cat.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <span className="font-bold text-slate-700">{cat.name}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRestore('category', cat.id)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                                >
                                                    復原
                                                </button>
                                                <button
                                                    onClick={() => handleHardDelete('category', cat.id)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                                                >
                                                    永久刪除
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Deleted Products */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">已刪除商品</h4>
                                {trashData.products.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm">無已刪除商品</p>
                                ) : (
                                    trashData.products.map(prod => (
                                        <div key={prod.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-700">{prod.name}</div>
                                                <div className="text-xs text-slate-500">${prod.base_price}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRestore('product', prod.id)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                                >
                                                    復原
                                                </button>
                                                <button
                                                    onClick={() => handleHardDelete('product', prod.id)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                                                >
                                                    永久刪除
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 flex justify-end">
                            <button onClick={() => setIsTrashModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
