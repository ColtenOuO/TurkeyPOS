import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Utensils, Trash2, ChevronRight, Info } from 'lucide-react';
import type { Category, Product, CartItem, ProductOption } from './types';
import SelectionModal from './components/SelectionModal';

const API_BASE = "http://localhost:8000/api/v1";

const App: React.FC = () => {
  const [menu, setMenu] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get<Category[]>(`${API_BASE}/menu/`);
        setMenu(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const confirmSelection = (options: ProductOption[], quantity: number) => {
    if (!selectedProduct) return;

    const extraPrice = options.reduce((sum, opt) => sum + opt.price_delta, 0);
    const totalUnitPrice = selectedProduct.base_price + extraPrice;
    
    const newItem: CartItem = {
      ...selectedProduct,
      total_unit_price: totalUnitPrice,
      base_price: selectedProduct.base_price,
      quantity: quantity,
      selected_option_ids: options.map(o => o.id)
    };

    setCart(prev => [...prev, newItem]);
    setSelectedProduct(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const orderPayload = {
        table_number: "A1", 
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          option_ids: item.selected_option_ids
        }))
      };
      await axios.post(`${API_BASE}/orders/`, orderPayload);
      alert("訂單已送出");
      setCart([]);
    } catch (err) {
      alert("送單失敗");
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-orange-500">
      LOADING...
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-orange-600 flex items-center gap-3 italic">
            <Utensils size={40} /> TurkeyPOS
          </h1>
          <p className="text-slate-400 font-bold ml-12">NCKU CSIE SENIOR PROJECT</p>
        </header>

        {menu.map(cat => (
          <section key={cat.id} className="mb-14">
            <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3">
              <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cat.products.map(p => (
                <button key={p.id} onClick={() => handleProductClick(p)}
                  className="group bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-orange-500 transition-all text-left">
                  <div className="font-black text-2xl mb-2 text-slate-800">{p.name}</div>
                  <div className="text-3xl font-black text-orange-600">${p.base_price}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      <aside className="w-[480px] bg-white border-l-4 border-slate-50 shadow-2xl flex flex-col">
        <div className="p-8 border-b-4 border-slate-50">
          <h2 className="font-black text-3xl flex items-center gap-3 text-slate-800">
            <ShoppingCart className="text-orange-500" size={32} /> 清單
          </h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.map((item, i) => {
            const selectedOptions = item.options.filter(opt => item.selected_option_ids.includes(opt.id));
            return (
              <div key={i} className="p-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative">
                <div className="font-black text-xl text-slate-800">{item.name}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-500 border border-slate-200">
                    數量: {item.quantity}
                  </span>
                  {selectedOptions.map(opt => (
                    <span key={opt.id} className="bg-orange-100 px-3 py-1 rounded-full text-xs font-black text-orange-600 border border-orange-200">
                      + {opt.name}
                    </span>
                  ))}
                </div>
                <div className="absolute right-6 top-6 text-2xl font-black text-orange-600">
                  ${item.total_unit_price * item.quantity}
                </div>
                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="mt-4 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="p-8 bg-slate-50 border-t-4 border-slate-100">
          <div className="flex justify-between items-end mb-8">
            <span className="text-slate-400 font-black text-lg">TOTAL</span>
            <span className="text-6xl font-black text-slate-900 tracking-tighter">
              <span className="text-3xl text-orange-500 mr-2">$</span>
              {cart.reduce((s, i) => s + (i.total_unit_price * i.quantity), 0)}
            </span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0}
            className="w-full bg-orange-600 text-white py-8 rounded-[3rem] font-black text-3xl shadow-xl shadow-orange-100 active:scale-95 disabled:bg-slate-200 transition-all">
            確認送單
          </button>
        </div>
      </aside>

      {selectedProduct && (
        <SelectionModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onConfirm={confirmSelection} 
        />
      )}
    </div>
  );
};

export default App;