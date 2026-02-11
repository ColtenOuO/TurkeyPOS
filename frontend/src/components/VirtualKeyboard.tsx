import React, { useState } from 'react';
import { Delete, Check, X } from 'lucide-react';

interface VirtualKeyboardProps {
    initialValue?: string;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title?: string;
    mode?: 'alphanumeric' | 'numeric';
}

const ALPHA_KEYS = [
    ['1', '2', '3', 'A', 'B'],
    ['4', '5', '6', 'C', 'D'],
    ['7', '8', '9', 'E', 'F'],
    ['0', 'G', 'H', 'I', 'J'],
];

const NUMERIC_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '00', '.'],
];

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
    initialValue = "",
    onClose,
    onConfirm,
    title = "Enter Value",
    mode = 'alphanumeric'
}) => {
    const [value, setValue] = useState(initialValue);

    const handleKeyPress = (key: string) => {
        if (value.length < 10) {
            setValue(prev => prev + key);
        }
    };

    const handleBackspace = () => {
        setValue(prev => prev.slice(0, -1));
    };

    const keys = mode === 'numeric' ? NUMERIC_KEYS : ALPHA_KEYS;
    const gridCols = mode === 'numeric' ? 'grid-cols-3' : 'grid-cols-5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/50 w-full ${mode === 'numeric' ? 'max-w-xs' : 'max-w-md'} scale-in-95 animate-in duration-200`}>
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                        {title}
                    </label>
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-center">
                        <span className="text-4xl font-black text-slate-800 tracking-wider font-mono break-all">
                            {value || <span className="text-slate-200">_</span>}
                        </span>
                    </div>
                </div>

                <div className={`grid ${gridCols} gap-3 mb-6`}>
                    {keys.flat().map((key) => (
                        <button
                            key={key}
                            onClick={() => handleKeyPress(key)}
                            className="aspect-square bg-white rounded-2xl shadow-sm border-b-4 border-slate-100 active:border-b-0 active:translate-y-1 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all font-black text-xl text-slate-700 flex items-center justify-center bg-gradient-to-br from-white to-slate-50"
                        >
                            {key}
                        </button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        className={`${mode === 'numeric' ? 'col-span-3' : 'col-span-5'} py-4 bg-red-50 text-red-500 rounded-2xl shadow-sm border-b-4 border-red-100 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center`}
                    >
                        <Delete size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="py-4 rounded-2xl font-black text-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        className="py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        disabled={!value}
                    >
                        <Check size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;
