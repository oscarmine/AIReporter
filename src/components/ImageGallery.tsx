import { useState } from 'react';
import { StoredImage, deleteImage } from '../lib/images';

interface ImageGalleryProps {
    images: StoredImage[];
    onRefresh: () => void;
    onInsertRef: (imageId: string) => void;
    onRename: (imageId: string) => void;
}

export function ImageGallery({ images, onRefresh, onInsertRef, onRename }: ImageGalleryProps) {
    const [previewImage, setPreviewImage] = useState<StoredImage | null>(null);

    const handleDelete = async (imageId: string) => {
        if (confirm('Delete this screenshot?')) {
            await deleteImage(imageId);
            onRefresh();
        }
    };

    if (images.length === 0) return null;

    return (
        <>
            {/* Gallery Row */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-white/[0.02] overflow-x-auto custom-scrollbar">
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
                                src={`media://${encodeURIComponent(img.filePath)}`}
                                alt={img.description}
                                className="w-full h-full object-cover"
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
                                className="w-5 h-5 rounded-full bg-blue-500/90 text-white text-[10px] flex items-center justify-center hover:bg-blue-400 hover:scale-110 transition-all shadow-lg border border-white/10"
                                title={`Insert @${img.id}`}
                            >
                                @
                            </button>
                            <button
                                onClick={() => onRename(img.id)}
                                className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all shadow-lg border border-white/10"
                                title="Rename Description"
                            >
                                ✎
                            </button>
                            <button
                                onClick={() => handleDelete(img.id)}
                                className="w-5 h-5 rounded-full bg-red-500/90 text-white text-[10px] flex items-center justify-center hover:bg-red-400 hover:scale-110 transition-all shadow-lg border border-white/10"
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
                                <a
                                    href={`media://${encodeURIComponent(previewImage.filePath)}`}
                                    download={`${previewImage.id}.png`}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 inline-block"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    ⬇ Download
                                </a>
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="px-3 py-1 text-xs bg-white/10 text-white rounded hover:bg-white/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <img
                            src={`media://${encodeURIComponent(previewImage.filePath)}`}
                            alt={previewImage.description}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
