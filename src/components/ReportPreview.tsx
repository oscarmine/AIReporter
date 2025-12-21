import ReactMarkdown from 'react-markdown';

export function ReportPreview({ markdown }: { markdown: string }) {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar px-8 py-6 bg-white/5">
            <article className="prose prose-invert prose-lg max-w-none">
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
