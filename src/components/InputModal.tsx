import { useState, useEffect, useRef } from 'react';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    placeholder: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    initialValue?: string;
    submitLabel?: string;
}

export function InputModal({ isOpen, title, placeholder, onSubmit, onCancel, initialValue = '', submitLabel = 'Add Screenshot' }: InputModalProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 mb-4"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {submitLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
