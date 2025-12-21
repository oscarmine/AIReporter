import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownEditorProps {
    value: string;
    previewValue?: string; // Optional: use for preview if provided (e.g., with images rendered)
    onChange: (value: string) => void;
}

export function MarkdownEditor({ value, previewValue, onChange }: MarkdownEditorProps) {
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        active={viewMode === 'edit'}
                        onClick={() => setViewMode('edit')}
                        title="Edit Only"
                    >
                        ✏️
                    </ToolbarButton>
                    <ToolbarButton
                        active={viewMode === 'split'}
                        onClick={() => setViewMode('split')}
                        title="Split View"
                    >
                        ⬜
                    </ToolbarButton>
                    <ToolbarButton
                        active={viewMode === 'preview'}
                        onClick={() => setViewMode('preview')}
                        title="Preview Only"
                    >
                        👁️
                    </ToolbarButton>
                </div>
                <div className="text-xs text-white/30">
                    {value.length} chars • {value.split(/\s+/).filter(Boolean).length} words
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Editor Panel */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                    <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full border-r border-white/5`}>
                        <textarea
                            className="w-full h-full bg-transparent p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none text-white/90 placeholder:text-white/20 custom-scrollbar"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Edit your markdown here..."
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Preview Panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-y-auto custom-scrollbar px-6 py-4 bg-white/[0.02]`}>
                        <article className="prose prose-invert prose-sm max-w-none prose-table:border-collapse prose-th:border prose-th:border-white/20 prose-th:bg-white/5 prose-th:p-2 prose-td:border prose-td:border-white/10 prose-td:p-2 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-300 prose-code:before:content-none prose-code:after:content-none">
                            <ReactMarkdown
                                urlTransform={(url) => url}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    img: ({ src, alt }) => (
                                        <img
                                            src={src}
                                            alt={alt || 'Screenshot'}
                                            loading="lazy"
                                            className="max-w-full max-h-[500px] object-contain h-auto rounded-lg border border-white/10"
                                        />
                                    )
                                }}
                            >
                                {previewValue ?? value}
                            </ReactMarkdown>
                        </article>
                    </div>
                )}
            </div>
        </div>
    );
}

function ToolbarButton({
    children,
    active,
    onClick,
    title
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
        px-2 py-1 rounded text-xs transition-colors
        ${active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}
      `}
        >
            {children}
        </button>
    );
}
