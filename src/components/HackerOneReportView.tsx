import { useState, useEffect, useCallback, useRef } from 'react';
import { parseHackerOneReport, HackerOneReport } from '../lib/h1Parser';
import { useToast } from './Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getSettings } from '../lib/storage';

interface HackerOneReportViewProps {
    markdown: string;
    previewMarkdown?: string;
    onMarkdownChange?: (newMarkdown: string) => void;
}

export function HackerOneReportView({ markdown, previewMarkdown, onMarkdownChange }: HackerOneReportViewProps) {
    const [sections, setSections] = useState<HackerOneReport | null>(null);
    const { addToast } = useToast();
    const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const isInternalUpdate = useRef(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    const accentColor = getSettings().accentColor || '#4ade80';

    useEffect(() => {
        // Only parse from external markdown changes, not from our own edits
        if (!isInternalUpdate.current && markdown) {
            setSections(parseHackerOneReport(markdown));
        }
        isInternalUpdate.current = false;
    }, [markdown]);

    const handleSectionChange = useCallback((key: keyof HackerOneReport, value: string) => {
        if (!sections) return;

        const newSections = { ...sections, [key]: value };
        setSections(newSections);

        if (onMarkdownChange) {
            isInternalUpdate.current = true;
            const newMarkdown = `<<<ASSET>>>
${newSections.asset}
<<<END_ASSET>>>

<<<WEAKNESS>>>
${newSections.weakness}
<<<END_WEAKNESS>>>

<<<SEVERITY>>>
${newSections.severity}
<<<END_SEVERITY>>>

<<<TITLE>>>
${newSections.title}
<<<END_TITLE>>>

<<<DESCRIPTION>>>
${newSections.description}
<<<END_DESCRIPTION>>>

<<<IMPACT>>>
${newSections.impact}
<<<END_IMPACT>>>`;
            onMarkdownChange(newMarkdown);
        }
    }, [sections, onMarkdownChange]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        addToast(`Copied ${label}`, 'success');

        if (timeoutId) clearTimeout(timeoutId);

        setActiveCopyId(label);
        const newTimeout = setTimeout(() => {
            setActiveCopyId(null);
            setTimeoutId(null);
        }, 1000);
        setTimeoutId(newTimeout);
    };

    if (!sections) {
        return (
            <div className="flex items-center justify-center h-full text-white/50">
                Generate a report to see the HackerOne structure.
            </div>
        );
    }

    const isEmpty = Object.values(sections).every(val => !val);
    if (isEmpty && markdown) {
        return (
            <div className="p-6 text-white/70">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-4">
                    <h3 className="text-yellow-500 font-bold mb-2">Parsing Error / Standard Format Detected</h3>
                    <p>The report doesn't match the new HackerOne structure. It might have been generated in Standard mode or without the strict delimiters.</p>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-mono opacity-70 p-4 bg-black/20 rounded">
                    {markdown}
                </pre>
            </div>
        );
    }

    // Parse sections from previewMarkdown (which has images resolved) for preview
    const previewSections = previewMarkdown ? parseHackerOneReport(previewMarkdown) : sections;

    // Build clean preview markdown from sections (no delimiters)
    const combinedPreviewMarkdown = previewSections ? `# ${previewSections.title}

**Asset:** ${previewSections.asset}  
**Weakness:** ${previewSections.weakness}  
**Severity:** ${previewSections.severity}

---

${previewSections.description}

---

## Impact

${previewSections.impact}` : '';

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar at top */}
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'edit' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'preview' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        👁️ Preview
                    </button>
                </div>
                <div className="text-xs text-white/30">
                    HackerOne Report
                </div>
            </div>

            {/* Content */}
            {viewMode === 'edit' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <SectionCard
                        title="Asset"
                        content={sections.asset}
                        onCopy={() => handleCopy(sections.asset, 'Asset')}
                        isCopied={activeCopyId === 'Asset'}
                        onChange={(val) => handleSectionChange('asset', val)}
                    />
                    <SectionCard
                        title="Weakness"
                        content={sections.weakness}
                        onCopy={() => handleCopy(sections.weakness, 'Weakness')}
                        isCopied={activeCopyId === 'Weakness'}
                        onChange={(val) => handleSectionChange('weakness', val)}
                    />
                    <SectionCard
                        title="Severity"
                        content={sections.severity}
                        onCopy={() => handleCopy(sections.severity, 'Severity')}
                        isCopied={activeCopyId === 'Severity'}
                        onChange={(val) => handleSectionChange('severity', val)}
                    />
                    <SectionCard
                        title="Title"
                        content={sections.title}
                        onCopy={() => handleCopy(sections.title, 'Title')}
                        isCopied={activeCopyId === 'Title'}
                        onChange={(val) => handleSectionChange('title', val)}
                    />

                    <SectionCard
                        title="Description"
                        content={sections.description}
                        onCopy={() => handleCopy(sections.description, 'Description')}
                        isCopied={activeCopyId === 'Description'}
                        onChange={(val) => handleSectionChange('description', val)}
                        isTextArea
                    />

                    <SectionCard
                        title="Impact"
                        content={sections.impact}
                        onCopy={() => handleCopy(sections.impact, 'Impact')}
                        isCopied={activeCopyId === 'Impact'}
                        onChange={(val) => handleSectionChange('impact', val)}
                        isTextArea
                    />
                </div>
            ) : (
                <div
                    className="flex-1 overflow-y-auto p-6 custom-scrollbar"
                    style={{ '--accent-color': accentColor } as React.CSSProperties}
                >
                    <article className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-code:bg-[var(--accent-color)]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[var(--accent-color)] prose-code:before:content-none prose-code:after:content-none prose-pre:bg-black/30">
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
                                        className="max-w-full max-h-[500px] object-contain h-auto rounded-lg border border-white/10 my-4"
                                    />
                                )
                            }}
                        >
                            {combinedPreviewMarkdown}
                        </ReactMarkdown>
                    </article>
                </div>
            )}
        </div>
    );
}

function SectionCard({
    title,
    content,
    onCopy,
    isCopied,
    onChange,
    isTextArea = false
}: {
    title: string,
    content: string,
    onCopy: () => void,
    isCopied: boolean,
    onChange: (val: string) => void,
    isTextArea?: boolean
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to get accurate scrollHeight
            textarea.style.height = '0px';
            // Set to scrollHeight (includes padding due to box-sizing)
            const newHeight = Math.max(textarea.scrollHeight, isTextArea ? 100 : 38);
            textarea.style.height = `${newHeight}px`;
        }
    }, [content, isTextArea]);

    return (
        <div className="flex flex-col gap-2 relative group">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">{title}</h3>
                <div className="relative">
                    <button
                        onClick={onCopy}
                        className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white/80 transition-colors"
                    >
                        Copy
                    </button>

                    <div className={`
                        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        px-2 py-1 bg-black/90 text-white text-[10px] rounded shadow-lg 
                        whitespace-nowrap border border-white/10 backdrop-blur-md 
                        z-50 pointer-events-none transition-all duration-300 ease-in-out
                        ${isCopied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        Copied!
                    </div>
                </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-lg">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent p-3 text-white font-mono text-sm resize-none outline-none focus:bg-black/40 transition-colors placeholder:text-white/20 rounded-lg overflow-hidden box-border"
                    placeholder={`Enter ${title}...`}
                />
            </div>
        </div>
    );
}
