import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    message: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    message,
    description,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-white/50">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${isDangerous ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <AlertCircle size={32} className={isDangerous ? 'text-red-500' : 'text-orange-500'} strokeWidth={3} />
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">
                        {message}
                    </h3>
                    {description && (
                        <p className="text-slate-500 font-bold text-sm">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 w-full mt-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-4 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
