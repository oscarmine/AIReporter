import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getSettings } from '../lib/storage';

interface MarkdownEditorProps {
    value: string;
    previewValue?: string; // Optional: use for preview if provided (e.g., with images rendered)
    onChange: (value: string) => void;
}

export function MarkdownEditor({ value, previewValue, onChange }: MarkdownEditorProps) {
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef<'editor' | 'preview' | null>(null);

    const accentColor = getSettings().accentColor || '#4ade80';

    const handleScroll = (source: 'editor' | 'preview') => {
        if (viewMode !== 'split') return;

        // Prevent recursive scrolling
        if (isScrolling.current && isScrolling.current !== source) return;

        isScrolling.current = source;
        const sourceEl = source === 'editor' ? editorRef.current : previewRef.current;
        const targetEl = source === 'editor' ? previewRef.current : editorRef.current;

        if (sourceEl && targetEl) {
            const percentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
            const targetScrollTop = percentage * (targetEl.scrollHeight - targetEl.clientHeight);

            // Only update if difference is significant to avoid jitter
            if (Math.abs(targetEl.scrollTop - targetScrollTop) > 1) {
                targetEl.scrollTop = targetScrollTop;
            }
        }

        // Reset locking after a delay
        setTimeout(() => {
            if (isScrolling.current === source) {
                isScrolling.current = null;
            }
        }, 50);
    };

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
                            ref={editorRef}
                            onScroll={() => handleScroll('editor')}
                            className="w-full h-full bg-transparent p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none text-white/90 placeholder:text-white/20 no-scrollbar"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Edit your markdown here..."
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Preview Panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div
                        ref={previewRef}
                        onScroll={() => handleScroll('preview')}
                        className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-y-auto custom-scrollbar px-6 py-4 bg-white/[0.02]`}
                        style={{ '--accent-color': accentColor } as React.CSSProperties}
                    >
                        <article className="prose prose-invert prose-sm max-w-none prose-table:border-collapse prose-th:border prose-th:border-white/20 prose-th:bg-white/5 prose-th:p-2 prose-td:border prose-td:border-white/10 prose-td:p-2 prose-code:bg-[var(--accent-color)]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[var(--accent-color)] prose-code:before:content-none prose-code:after:content-none">
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
                                    ),
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                        // Simple renderer for inline code, stripping 'node' prop
                                        return <code className={className} {...props}>{children}</code>;
                                    },
                                    pre: (props: any) => {
                                        const { children } = props;
                                        // Extract language from the child <code> element
                                        const child = Array.isArray(children) ? children[0] : children;
                                        const className = child?.props?.className || '';
                                        const match = /language-(\w+)/.exec(className);
                                        const lang = match ? match[1] : 'text';

                                        const label = lang.toUpperCase();

                                        return (
                                            <div className="my-5 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#111111] shadow-lg">
                                                <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 flex items-center">
                                                    <span
                                                        className="font-mono text-xs font-semibold tracking-wide px-2 py-0.5 rounded"
                                                        style={{ color: accentColor, backgroundColor: `${accentColor}1A` }}
                                                    >
                                                        {label}
                                                    </span>
                                                </div>
                                                <pre className="!m-0 !p-4 !bg-transparent overflow-x-auto">
                                                    {children}
                                                </pre>
                                            </div>
                                        );
                                    }
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
