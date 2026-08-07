import React, { useState } from 'react';
import { X, Delete, Minus, Plus } from 'lucide-react';
import type { Product, ProductOption } from '../types';

interface Props {
  product: Product;
  onClose: () => void;
  onConfirm: (selectedOptions: ProductOption[], quantity: number) => void;
  /** 精簡模式：手機 / 網頁預定用，POS 觸控機請維持預設 */
  compact?: boolean;
}

const SelectionModal: React.FC<Props> = ({ product, onClose, onConfirm, compact = false }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantityStr, setQuantityStr] = useState<string>(compact ? "1" : "0");

  const toggleOption = (opt: ProductOption) => {
    if (opt.is_required) {
      const otherRequiredIds = product.options
        .filter(o => o.is_required && o.id !== opt.id)
        .map(o => o.id);
      setSelectedIds(prev => [...prev.filter(id => !otherRequiredIds.includes(id)), opt.id]);
    } else {
      setSelectedIds(prev => 
        prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]
      );
    }
  };

  const handleKeypad = (num: string) => {
    setQuantityStr(prev => {
      if (prev === "0") return num;
      if (prev.length >= 2) return prev;
      return prev + num;
    });
  };

  const clearQuantity = () => setQuantityStr("0");
  const deleteLast = () => setQuantityStr(prev => (prev.length > 1 ? prev.slice(0, -1) : "0"));

  const handleConfirm = () => {
    const qty = parseInt(quantityStr);
    if (qty <= 0) {
      alert("⚠️ 數量不能為 0，請輸入正確數量！");
      return;
    }
    onConfirm(product.options.filter(o => selectedIds.includes(o.id)), qty);
  };

  if (compact) {
    const qty = parseInt(quantityStr) || 0;
    const step = (delta: number) => setQuantityStr(String(Math.min(99, Math.max(1, qty + delta))));
    const extraPrice = product.options
      .filter(o => selectedIds.includes(o.id))
      .reduce((sum, o) => sum + o.price_delta, 0);

    const optionButton = (opt: ProductOption) => (
      <button key={opt.id} onClick={() => toggleOption(opt)}
        className={`px-3 py-3 rounded-xl border-2 text-base font-bold transition-all ${selectedIds.includes(opt.id)
          ? 'border-orange-500 bg-orange-50 text-orange-600'
          : 'border-slate-100 bg-slate-50 text-slate-500'
          }`}>
        {opt.name}
        {opt.price_delta > 0 && <span className="block text-xs mt-0.5 opacity-60">+${opt.price_delta}</span>}
      </button>
    );

    return (
      // 手機為底部彈出 (bottom sheet)，桌機置中
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
          <div className="flex justify-between items-start p-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">{product.name}</h3>
              <div className="text-slate-400 font-bold text-sm mt-0.5">${product.base_price}</div>
            </div>
            <button onClick={onClose} className="p-2 -mr-1 -mt-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {product.options.some(o => o.is_required) && (
              <div>
                <p className="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">規格 (必選)</p>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.filter(o => o.is_required).map(optionButton)}
                </div>
              </div>
            )}
            {product.options.some(o => !o.is_required) && (
              <div>
                <p className="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">客製化 (可複選)</p>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.filter(o => !o.is_required).map(optionButton)}
                </div>
              </div>
            )}
            {product.options.length === 0 && (
              <p className="text-slate-400 font-bold text-center py-2">此餐點無需選擇規格</p>
            )}
          </div>

          <div className="p-5 pt-4 border-t border-slate-100 bg-slate-50/60 rounded-b-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-500">數量</span>
              <div className="flex items-center gap-3">
                <button onClick={() => step(-1)} disabled={qty <= 1}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 active:scale-90 transition-all">
                  <Minus size={20} strokeWidth={3} />
                </button>
                <span className="w-10 text-center text-2xl font-black text-slate-800">{qty}</span>
                <button onClick={() => step(1)}
                  className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 active:scale-90 transition-all">
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            <button onClick={handleConfirm}
              className="w-full py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              加入訂單
              <span className="opacity-90">${(product.base_price + extraPrice) * qty}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* 左側：選項選單 */}
        <div className="flex-1 p-12 overflow-y-auto max-h-[85vh]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-4xl font-black text-slate-800">{product.name}</h3>
            <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-full transition-colors"><X size={36} /></button>
          </div>

          <div className="space-y-12">
            {product.options.some(o => o.is_required) && (
              <div>
                <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Required / 規格</p>
                <div className="grid grid-cols-2 gap-4">
                  {product.options.filter(o => o.is_required).map(opt => (
                    <button key={opt.id} onClick={() => toggleOption(opt)}
                      className={`p-8 rounded-[2rem] border-4 text-2xl font-black transition-all ${
                        selectedIds.includes(opt.id) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-300'
                      }`}>
                      {opt.name}
                      <span className="block text-sm mt-1 opacity-50">
                        {opt.price_delta > 0 ? `+$${opt.price_delta}` : '+$0'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.options.some(o => !o.is_required) && (
              <div>
                <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Optional / 客製化</p>
                <div className="grid grid-cols-2 gap-4">
                  {product.options.filter(o => !o.is_required).map(opt => (
                    <button key={opt.id} onClick={() => toggleOption(opt)}
                      className={`p-8 rounded-[2rem] border-4 text-2xl font-black transition-all ${
                        selectedIds.includes(opt.id) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 text-slate-300'
                      }`}>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：數字鍵盤 */}
        <div className="w-full md:w-[450px] bg-slate-50 p-12 flex flex-col justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">Quantity / 數量</p>
            <div className={`rounded-[2.5rem] p-8 mb-10 border-4 transition-all text-center ${quantityStr === "0" ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-7xl font-black ${quantityStr === "0" ? 'text-red-300' : 'text-slate-800'}`}>
                {quantityStr}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                <button key={num} onClick={() => handleKeypad(num)}
                  className="bg-white aspect-square rounded-3xl shadow-sm border-2 border-slate-100 text-3xl font-black text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all active:scale-90">
                  {num}
                </button>
              ))}
              <button onClick={clearQuantity} className="bg-slate-200 rounded-3xl text-xl font-black text-slate-500 active:scale-90 hover:bg-slate-300 transition-colors">C</button>
              <button onClick={() => handleKeypad("0")} className="bg-white rounded-3xl border-2 border-slate-100 text-3xl font-black text-slate-700 active:scale-90">0</button>
              <button onClick={deleteLast} className="bg-slate-200 rounded-3xl flex items-center justify-center text-slate-500 active:scale-90 hover:bg-slate-300 transition-colors"><Delete size={32} /></button>
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            className={`w-full py-8 rounded-[2.5rem] font-black text-3xl shadow-2xl transition-all mt-10 active:scale-95 ${
              quantityStr === "0" ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700 hover:shadow-orange-200'
            }`}
          >
            確認數量
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;