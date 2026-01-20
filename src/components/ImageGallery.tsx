import { useState, useRef } from 'react';
import { StoredImage, deleteImage } from '../lib/images';

interface ImageGalleryProps {
    images: StoredImage[];
    onRefresh: () => void;
    onInsertRef: (imageId: string) => void;
    onEdit?: (imageId: string) => void;
}

export function ImageGallery({ images, onRefresh, onInsertRef, onEdit }: ImageGalleryProps) {
    const [previewImage, setPreviewImage] = useState<StoredImage | null>(null);
    const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
    const [cacheKey, setCacheKey] = useState(Date.now()); // Cache buster for image reload
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = async (imageId: string) => {
        if (confirm('Delete this screenshot?')) {
            await deleteImage(imageId);
            onRefresh();
        }
    };

    const handleReplaceClick = (imageId: string) => {
        setReplacingImageId(imageId);
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !replacingImageId) {
            setReplacingImageId(null);
            return;
        }

        try {
            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });

            // Replace the image file while keeping the same ID
            await window.ipcRenderer.invoke('replace-image', replacingImageId, base64Data);
            setCacheKey(Date.now()); // Bust cache to reload image
            onRefresh();
        } catch (err) {
            console.error('Failed to replace image:', err);
        } finally {
            setReplacingImageId(null);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (images.length === 0) return null;

    return (
        <>
            {/* Hidden file input for replacing images */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            {/* Gallery Row */}
            <div className="flex items-center gap-6 px-6 py-3 border-b border-white/5 bg-white/[0.02] overflow-x-auto custom-scrollbar">
                <span className="text-xs text-white/30 flex-shrink-0">Screenshots:</span>
                {images.map((img) => (
                    <div
                        key={img.id}
                        className="relative group flex-shrink-0"
                    >
                        <button
                            onClick={() => setPreviewImage(img)}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors bg-white/5 relative"
                            title={`${img.description} (${img.id})`}
                        >
                            <img
                                src={`media://${encodeURIComponent(img.filePath)}?t=${cacheKey}`}
                                alt={img.description}
                                className="w-full h-full object-cover"
                                draggable="false"
                            />
                        </button>

                        {/* ID Overlay - Top Center */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            <div className="bg-black/80 backdrop-blur text-white text-[9px] px-1.5 py-px rounded-full border border-white/10 whitespace-nowrap shadow-lg">
                                {img.id}
                            </div>
                        </div>

                        {/* Action Buttons - Bottom Center */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <button
                                onClick={() => onInsertRef(img.id)}
                                className="w-4 h-4 rounded-full bg-blue-500/90 text-white text-[9px] flex items-center justify-center hover:bg-blue-400 hover:scale-110 transition-all shadow-lg border border-white/10"
                                title={`Insert @${img.id}`}
                            >
                                @
                            </button>
                            <button
                                onClick={() => handleReplaceClick(img.id)}
                                className="w-4 h-4 rounded-full bg-orange-500/90 text-white flex items-center justify-center hover:bg-orange-400 hover:scale-110 transition-all shadow-lg border border-white/10"
                                title="Replace Image"
                            >
                                <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 4v6h-6M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                            </button>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(img.id)}
                                    className="w-4 h-4 rounded-full bg-green-500/90 text-white text-[9px] flex items-center justify-center hover:bg-green-400 hover:scale-110 transition-all shadow-lg border border-white/10"
                                    title="Edit / Annotate"
                                >
                                    ✏️
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(img.id)}
                                className="w-4 h-4 rounded-full bg-red-500/90 text-white text-[10px] leading-none flex items-center justify-center hover:bg-red-400 hover:scale-110 transition-all shadow-lg border border-white/10"
                                title="Delete"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="max-w-4xl max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className="text-white/50 text-xs">{previewImage.id}</span>
                                <span className="text-white ml-2">{previewImage.description}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        onInsertRef(previewImage.id);
                                        setPreviewImage(null);
                                    }}
                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-400"
                                >
                                    Insert @{previewImage.id}
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await window.ipcRenderer.invoke('save-image-as', previewImage.filePath, previewImage.id);
                                        } catch (err) {
                                            console.error('Failed to save image:', err);
                                        }
                                    }}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500"
                                >
                                    ⬇ Download
                                </button>
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="px-3 py-1 text-xs bg-white/10 text-white rounded hover:bg-white/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <img
                            src={`media://${encodeURIComponent(previewImage.filePath)}?t=${cacheKey}`}
                            alt={previewImage.description}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            draggable="false"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
