import { useState, useEffect } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    isExiting?: boolean;
    isEntering?: boolean;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: Toast['type'] = 'info') => {
        const id = Date.now().toString();
        // Start with entering state
        setToasts(prev => [...prev, { id, message, type, isExiting: false, isEntering: true }]);
        // Remove entering state after a frame to trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setToasts(prev => prev.map(t => t.id === id ? { ...t, isEntering: false } : t));
            });
        });
    };

    const removeToast = (id: string) => {
        // First mark as exiting to trigger animation
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        // Then remove after animation completes
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    };

    return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed top-16 right-0 z-50 flex flex-col gap-2 overflow-hidden" style={{ paddingRight: '16px' }}>
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

    const borderColor = {
        success: 'border-green-500/40',
        error: 'border-red-500/40',
        info: 'border-white/20'
    }[toast.type];

    const iconBg = {
        success: 'bg-green-500/20',
        error: 'bg-red-500/20',
        info: 'bg-white/10'
    }[toast.type];

    const icon = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    }[toast.type];

    const iconColor = {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400'
    }[toast.type];

    // Determine position based on state
    const isOffScreen = toast.isEntering || toast.isExiting;

    return (
        <div
            className={`
                backdrop-blur-2xl bg-white/5 border ${borderColor}
                px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 
                min-w-[280px] cursor-pointer
                transition-all duration-300 ease-out
                hover:bg-white/10
            `}
            style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transform: isOffScreen ? 'translateX(120%)' : 'translateX(0)',
                opacity: isOffScreen ? 0 : 1,
            }}
            onClick={onClose}
        >
            <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-bold ${iconColor}`}>{icon}</span>
            </div>
            <span className="text-sm font-medium text-white/90">{toast.message}</span>
        </div>
    );
}
