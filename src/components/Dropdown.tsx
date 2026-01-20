import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    title?: string;
    className?: string;
    maxHeight?: number;
}

export function Dropdown({ value, options, onChange, title, className = '', maxHeight = 200 }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get current label
    const currentLabel = options.find(opt => opt.value === value)?.label || value;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                title={title}
                className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded text-white/70 focus:outline-none focus:border-white/30 hover:bg-white/10 transition-colors flex items-center gap-2 min-w-[100px]"
            >
                <span className="flex-1 text-left truncate">{currentLabel}</span>
                <svg
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 min-w-full bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                    style={{ maxHeight, minWidth: '150px' }}
                >
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: maxHeight - 2 }}>
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors flex items-center gap-2 ${option.value === value
                                    ? 'bg-blue-500/20 text-white'
                                    : 'text-white/70'
                                    }`}
                            >
                                {option.value === value && (
                                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className={option.value === value ? '' : 'pl-5'}>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
