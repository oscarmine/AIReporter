import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generatePDFHtml } from '../lib/pdf-generator';
import { getSettings } from '../lib/storage';

interface ExportPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (htmlContent: string) => Promise<void>;
    markdown: string;
    title: string;
}

const ACCENT_COLORS = [
    { name: 'Green', value: '#4ade80' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'White', value: '#ffffff' },
];

export function ExportPDFModal({ isOpen, onClose, onExport, markdown, title }: ExportPDFModalProps) {
    const [accentColor, setAccentColor] = useState('#4ade80');
    const [customColor, setCustomColor] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Reset to saved accent color when modal opens
    useEffect(() => {
        if (isOpen) {
            const savedColor = getSettings().accentColor || '#4ade80';
            const isPresetColor = ACCENT_COLORS.some(c => c.value.toLowerCase() === savedColor.toLowerCase());

            if (isPresetColor) {
                setAccentColor(savedColor);
                setCustomColor('');
            } else {
                setAccentColor('#4ade80'); // Default preset
                setCustomColor(savedColor); // Put custom hex in the input
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoadingPreview(true);
        const html = generatePDFHtml(markdown, {
            seamless: true,
            accentColor: customColor || accentColor
        });

        // Update state for export function
        setPreviewHtml(html);

        // Render to iframe
        const timer = setTimeout(() => {
            if (iframeRef.current) {
                const doc = iframeRef.current.contentDocument;
                if (doc) {
                    try {
                        doc.open();
                        doc.write(html);
                        doc.close();
                    } catch (e) {
                        console.error("Error writing to iframe", e);
                    }
                }
            }
            // Always turn off loading state, even if iframe failed specific write
            setTimeout(() => setIsLoadingPreview(false), 100);
        }, 50);

        return () => clearTimeout(timer);
    }, [isOpen, markdown, accentColor, customColor]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await onExport(previewHtml);
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-8">
            <div className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[75vh] flex overflow-hidden animate-fade-in">

                {/* Left: Preview */}
                <div className="flex-1 bg-[#09090b] border-r border-white/5 relative flex flex-col min-w-0">
                    <div className="h-12 border-b border-white/5 flex items-center px-4 bg-[#18181b] shrink-0 z-20">
                        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Preview</span>
                    </div>
                    <div className="flex-1 bg-[#0d0d0d] overflow-hidden relative w-full">
                        {isLoadingPreview && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d] z-30 transition-opacity duration-200">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin"></div>
                                    <span className="text-xs text-white/40 font-medium">Rendering Preview...</span>
                                </div>
                            </div>
                        )}
                        <iframe
                            key={isOpen ? 'open' : 'closed'}
                            ref={iframeRef}
                            className={`w-full h-full border-none transition-opacity duration-300 ${isLoadingPreview ? 'opacity-0' : 'opacity-100'}`}
                            title="PDF Preview"
                        />
                    </div>
                </div>

                {/* Right: Settings */}
                <div className="w-72 bg-surface flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white mb-1">Export PDF</h2>
                        <p className="text-sm text-white/50">{title}</p>
                    </div>

                    <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">



                        {/* Accent Color */}
                        <section>
                            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">Accent Color</label>
                            <div className="grid grid-cols-6 gap-2 mb-4">
                                {ACCENT_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => {
                                            setAccentColor(color.value);
                                            setCustomColor('');
                                        }}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${(customColor === '' && accentColor === color.value) ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-xs text-white/50 whitespace-nowrap">Custom:</div>
                                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 flex-1">
                                    <span className="text-xs text-white/50 font-mono">#</span>
                                    <input
                                        type="text"
                                        value={customColor.replace(/^#/, '')}
                                        onChange={(e) => {
                                            const hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                            setCustomColor(hex ? `#${hex}` : '');
                                        }}
                                        placeholder="FFFFFF"
                                        maxLength={6}
                                        className="bg-transparent text-xs text-white uppercase focus:outline-none font-mono w-full"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 border-t border-white/5 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-[2] py-3 text-sm font-medium text-black bg-white hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                'Export PDF'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
