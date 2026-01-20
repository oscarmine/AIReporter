import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
    label: string;
    onClick: () => void;
    dangerous?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const menu = (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl animate-fade-in overflow-hidden flex flex-col"
            style={{
                left: `${x + 2}px`,
                top: `${y + 2}px`,
                transformOrigin: 'top left',
            }}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        onClose();
                        item.onClick();
                    }}
                    className={`
                        px-3 py-1.5 text-left text-xs transition-colors whitespace-nowrap
                        ${item.dangerous
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-white/90 hover:bg-white/10'
                        }
                    `}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );

    return createPortal(menu, document.body);
}
