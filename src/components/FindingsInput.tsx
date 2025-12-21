export function FindingsInput({
    value,
    onChange,
    onGenerate,
    isGenerating
}: {
    value: string;
    onChange: (val: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}) {
    return (
        <div className="flex flex-col h-full relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <textarea
                className="flex-1 w-full bg-transparent p-6 text-lg font-light leading-relaxed resize-none focus:outline-none placeholder:text-white/20"
                placeholder="Enter your findings, observations, or raw notes here..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
            />

            <div className="absolute bottom-6 right-6">
                <button
                    onClick={onGenerate}
                    disabled={!value.trim() || isGenerating}
                    className="
                    px-6 py-3 rounded-full 
                    bg-white text-black font-semibold tracking-wide 
                    shadow-[0_0_20px_rgba(255,255,255,0.3)] 
                    hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] 
                    hover:scale-105
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
                    transition-all duration-300 ease-out
                "
                >
                    <span className="flex items-center gap-2">
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>✨ Generate Report</>
                        )}
                    </span>
                </button>
            </div>
        </div>
    )
}
