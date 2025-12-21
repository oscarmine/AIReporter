import { useState, useEffect } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: Toast['type'] = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: 'bg-green-500/20 border-green-500/30',
        error: 'bg-red-500/20 border-red-500/30',
        info: 'bg-white/10 border-white/10'
    }[toast.type];

    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    }[toast.type];

    return (
        <div
            className={`
                backdrop-blur-xl bg-black/40 border ${bgColor} 
                px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 
                min-w-[280px] animate-slide-in transform transition-all
                hover:bg-black/50 hover:scale-[1.02] cursor-pointer
            `}
            onClick={onClose}
        >
            <span className="text-lg drop-shadow-md">{icon}</span>
            <span className="text-sm font-medium text-white/90 drop-shadow-sm">{toast.message}</span>
        </div>
    );
}
