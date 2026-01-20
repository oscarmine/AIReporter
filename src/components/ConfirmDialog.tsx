import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    dangerous?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    dangerous = true,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const dialog = (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-5 w-[280px] animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-white font-medium text-base mb-2">{title}</h3>
                <p className="text-white/60 text-sm mb-5">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${dangerous
                            ? 'bg-red-500 hover:bg-red-400 text-white'
                            : 'bg-white hover:bg-gray-200 text-black'
                            }`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 text-sm text-white/70 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialog, document.body);
}
