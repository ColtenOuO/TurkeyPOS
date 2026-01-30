import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessModalProps {
    message?: string;
    onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ message = "Success!", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000); // Auto close after 2 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[320px] animate-in zoom-in-95 duration-200 border border-white/50">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200 animate-bounce">
                        <Check size={40} className="text-white stroke-[4]" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 text-center">
                    {message}
                </h3>
            </div>
        </div>
    );
};

export default SuccessModal;
