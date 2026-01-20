import ReactMarkdown from 'react-markdown';
import { getSettings } from '../lib/storage';

export function ReportPreview({ markdown }: { markdown: string }) {
    const accentColor = getSettings().accentColor || '#4ade80';

    return (
        <div
            className="h-full overflow-y-auto custom-scrollbar px-8 py-6 bg-white/5"
            style={{ '--accent-color': accentColor } as React.CSSProperties}
        >
            <article className="prose prose-invert prose-lg max-w-none prose-a:text-[var(--accent-color)] prose-code:text-[var(--accent-color)] prose-code:bg-[var(--accent-color)]/10">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </article>
            {/* Fallback empty state */}
            {!markdown && (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                    <div className="text-4xl mb-4">📄</div>
                    <p>Generated report will appear here</p>
                </div>
            )}
        </div>
    )
}
