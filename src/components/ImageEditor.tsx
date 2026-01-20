import { useState, useRef, useEffect, useCallback } from 'react';

type Tool = 'brush' | 'box' | 'arrow';
type Color = '#000000' | '#ff0000' | '#ffffff';

interface ImageEditorProps {
    imageSrc: string;
    initialDescription?: string;
    onSave: (editedBase64: string, description: string) => void;
    onCancel: () => void;
    onDirtyChange?: (isDirty: boolean) => void;
}

interface DrawAction {
    tool: Tool;
    color: Color;
    strokeWidth: number;
    fill?: boolean;
    points?: { x: number; y: number }[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

export function ImageEditor({ imageSrc, initialDescription = '', onSave, onCancel, onDirtyChange }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tool, setTool] = useState<Tool>('brush');
    const [color, setColor] = useState<Color>('#ff0000');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [fillBox, setFillBox] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [description, setDescription] = useState(initialDescription);
    const [showDescriptionInput, setShowDescriptionInput] = useState(false);
    const [actions, setActions] = useState<DrawAction[]>([]);
    const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
    const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Zoom and pan state
    const [scale, setScale] = useState<number | null>(null); // null until calculated
    const baseScaleRef = useRef<number>(1); // The "100%" baseline (fit scale)
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Load image and calculate fit scale
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            // Calculate scale to fit image in viewport (with padding)
            const container = containerRef.current;
            if (container) {
                const containerWidth = container.clientWidth - 48;
                const containerHeight = container.clientHeight - 48;
                // Scale to best fit viewport (works for both large and small images)
                const fitScale = Math.min(
                    containerWidth / img.width,
                    containerHeight / img.height
                );
                baseScaleRef.current = fitScale; // This is our "100%"
                setScale(fitScale);
            }
            setImageLoaded(true);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Redraw canvas
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;
        if (!canvas || !ctx || !img) return;

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Draw all completed actions
        [...actions, currentAction].filter(Boolean).forEach(action => {
            if (!action) return;
            ctx.strokeStyle = action.color;
            ctx.fillStyle = action.color;
            ctx.lineWidth = action.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (action.tool === 'brush' && action.points && action.points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(action.points[0].x, action.points[0].y);
                action.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (action.tool === 'box' && action.start && action.end) {
                const x = Math.min(action.start.x, action.end.x);
                const y = Math.min(action.start.y, action.end.y);
                const w = Math.abs(action.end.x - action.start.x);
                const h = Math.abs(action.end.y - action.start.y);
                if (action.fill) {
                    ctx.fillRect(x, y, w, h);
                } else {
                    ctx.strokeRect(x, y, w, h);
                }
            } else if (action.tool === 'arrow' && action.start && action.end) {
                const headLen = 25 + action.strokeWidth * 3; // Longer arrow head
                const headWidth = Math.PI / 5; // Wider angle (~36 degrees)
                const dx = action.end.x - action.start.x;
                const dy = action.end.y - action.start.y;
                const angle = Math.atan2(dy, dx);

                // Line (stop before arrowhead base)
                const lineEndX = action.end.x - (headLen * 0.7) * Math.cos(angle);
                const lineEndY = action.end.y - (headLen * 0.7) * Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(action.start.x, action.start.y);
                ctx.lineTo(lineEndX, lineEndY);
                ctx.stroke();

                // Sharp arrowhead (wider and pointy)
                ctx.beginPath();
                ctx.moveTo(action.end.x, action.end.y); // Tip
                ctx.lineTo(action.end.x - headLen * Math.cos(angle - headWidth), action.end.y - headLen * Math.sin(angle - headWidth));
                ctx.lineTo(action.end.x - headLen * 0.6 * Math.cos(angle), action.end.y - headLen * 0.6 * Math.sin(angle)); // Notch
                ctx.lineTo(action.end.x - headLen * Math.cos(angle + headWidth), action.end.y - headLen * Math.sin(angle + headWidth));
                ctx.closePath();
                ctx.fill();
            }
        });
    }, [actions, currentAction]);

    useEffect(() => {
        if (imageLoaded) redraw();
    }, [imageLoaded, redraw]);

    // Notify parent about dirty state
    useEffect(() => {
        onDirtyChange?.(actions.length > 0);
    }, [actions.length, onDirtyChange]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Redo
                    if (redoStack.length > 0) {
                        const action = redoStack[redoStack.length - 1];
                        setRedoStack(prev => prev.slice(0, -1));
                        setActions(prev => [...prev, action]);
                    }
                } else {
                    // Undo
                    if (actions.length > 0) {
                        const action = actions[actions.length - 1];
                        setActions(prev => prev.slice(0, -1));
                        setRedoStack(prev => [...prev, action]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, redoStack]);

    // Get mouse position relative to canvas (accounting for zoom/pan)
    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Middle mouse button or space+click for panning
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            return;
        }

        const pos = getPos(e);
        setIsDrawing(true);
        setRedoStack([]); // Clear redo stack on new action

        if (tool === 'brush') {
            setCurrentAction({ tool, color, strokeWidth, points: [pos] });
        } else {
            setCurrentAction({ tool, color, strokeWidth, fill: tool === 'box' ? fillBox : false, start: pos, end: pos });
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (currentAction) {
            setActions(prev => [...prev, currentAction]);
            setCurrentAction(null);
        }
        setIsDrawing(false);
    };

    // Global mouse tracking for drawing outside canvas
    useEffect(() => {
        if (!isDrawing && !isPanning) return;

        const handleGlobalMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const pos = {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };

            if (isPanning) {
                setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            } else if (isDrawing && currentAction) {
                if (tool === 'brush') {
                    setCurrentAction(prev => prev ? { ...prev, points: [...(prev.points || []), pos] } : null);
                } else {
                    setCurrentAction(prev => prev ? { ...prev, end: pos } : null);
                }
            }
        };

        const handleGlobalUp = () => {
            handleMouseUp();
        };

        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
        };
    }, [isDrawing, isPanning, currentAction, tool, panStart]);

    // Mouse wheel zoom (centered on cursor)
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container || scale === null) return;

        const delta = e.deltaY > 0 ? 0.97 : 1.03; // Much slower zoom
        const newScale = Math.min(Math.max(0.1, scale * delta), 5);

        // Get cursor position relative to container center
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;

        // Adjust offset to zoom towards cursor
        const scaleChange = newScale / scale;
        setOffset(prev => ({
            x: cursorX - (cursorX - prev.x) * scaleChange,
            y: cursorY - (cursorY - prev.y) * scaleChange
        }));

        setScale(newScale);
    };

    const handleClear = () => {
        setActions([]);
        setCurrentAction(null);
        setRedoStack([]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl, description);
    };

    const handleUndo = () => {
        if (actions.length > 0) {
            const action = actions[actions.length - 1];
            setActions(prev => prev.slice(0, -1));
            setRedoStack(prev => [...prev, action]);
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const action = redoStack[redoStack.length - 1];
            setRedoStack(prev => prev.slice(0, -1));
            setActions(prev => [...prev, action]);
        }
    };

    const handleResetView = () => {
        // Recalculate fit scale
        const img = imageRef.current;
        const container = containerRef.current;
        if (img && container) {
            const containerWidth = container.clientWidth - 48;
            const containerHeight = container.clientHeight - 48;
            const fitScale = Math.min(
                containerWidth / img.width,
                containerHeight / img.height
            );
            baseScaleRef.current = fitScale;
            setScale(fitScale);
        } else {
            setScale(1);
        }
        setOffset({ x: 0, y: 0 });
    };

    const toolButtons: { id: Tool; icon: string; label: string }[] = [
        { id: 'brush', icon: '✏️', label: 'Brush' },
        { id: 'box', icon: '⬜', label: 'Box' },
        { id: 'arrow', icon: '➡️', label: 'Arrow' }
    ];

    const colorButtons: { color: Color; label: string }[] = [
        { color: '#000000', label: 'Black' },
        { color: '#ff0000', label: 'Red' },
        { color: '#ffffff', label: 'White' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full h-full max-w-[1600px] max-h-[90vh] flex flex-col bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden border border-white/10 relative">
                {/* Toolbar - responsive */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-[#1a1a1a] border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {/* Tools */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            {toolButtons.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id)}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded transition-colors ${tool === t.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
                                    title={t.label}
                                >
                                    <span className="sm:hidden">{t.icon}</span>
                                    <span className="hidden sm:inline">{t.icon} {t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-white/20" />

                        {/* Colors */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            {colorButtons.map(c => (
                                <button
                                    key={c.color}
                                    onClick={() => setColor(c.color)}
                                    className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 transition-all ${color === c.color ? 'border-blue-400 scale-110' : 'border-white/30'}`}
                                    style={{ backgroundColor: c.color }}
                                    title={c.label}
                                />
                            ))}
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-white/20" />

                        {/* Stroke Width */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="hidden sm:inline text-xs text-white/50">Size:</span>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                className="w-12 sm:w-20 h-1 accent-blue-500"
                            />
                            <span className="text-xs text-white/70 w-4">{strokeWidth}</span>
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-white/20" />

                        {/* Undo / Redo / Clear */}
                        <div className="flex items-center">
                            <button
                                onClick={handleUndo}
                                disabled={actions.length === 0}
                                className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm text-white/70 hover:bg-white/10 rounded disabled:opacity-30"
                                title="Undo (Ctrl+Z)"
                            >
                                ↩
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={redoStack.length === 0}
                                className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm text-white/70 hover:bg-white/10 rounded disabled:opacity-30"
                                title="Redo (Ctrl+Shift+Z)"
                            >
                                ↪
                            </button>
                            <button
                                onClick={handleClear}
                                disabled={actions.length === 0}
                                className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm text-white/70 hover:bg-white/10 rounded disabled:opacity-30"
                                title="Clear All"
                            >
                                🗑
                            </button>
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-white/20" />

                        {/* Zoom controls */}
                        <button
                            onClick={handleResetView}
                            className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs text-white/70 hover:bg-white/10 rounded w-10 sm:w-12 text-center"
                            title="Reset Zoom"
                        >
                            {scale !== null ? `${Math.round((scale / baseScaleRef.current) * 100)}%` : '...'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Fill toggle for box - first */}
                        {tool === 'box' && (
                            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={fillBox}
                                    onChange={(e) => setFillBox(e.target.checked)}
                                    className="w-4 h-4 accent-red-500"
                                />
                                Fill
                            </label>
                        )}

                        {/* Description button */}
                        <button
                            onClick={() => setShowDescriptionInput(true)}
                            className="px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 rounded transition-colors"
                            title={description || 'Add description'}
                        >
                            📝 Description
                        </button>

                        {/* Description Modal */}
                        {showDescriptionInput && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                                <div className="bg-[#1e1e1e] border border-white/20 rounded-xl shadow-2xl p-6 w-[400px]">
                                    <h3 className="text-sm font-medium text-white mb-3">Screenshot Description</h3>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setShowDescriptionInput(false)}
                                        placeholder="What does this screenshot show?"
                                        autoFocus
                                        className="w-full px-4 py-4 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400"
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => setShowDescriptionInput(false)}
                                            className="px-4 py-2 text-sm text-white/70 hover:bg-white/10 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setShowDescriptionInput(false)}
                                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-400"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onCancel}
                            className="px-4 py-1.5 text-sm bg-white/10 text-white rounded hover:bg-white/20"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-400"
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Canvas container with zoom/pan */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-hidden flex items-center justify-center bg-[#0a0a0a]"
                    onWheel={handleWheel}
                >
                    {imageLoaded && scale !== null ? (
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            className="shadow-2xl"
                            style={{
                                cursor: isPanning ? 'grabbing' : 'crosshair',
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                transformOrigin: 'center',
                                maxWidth: 'none',
                                maxHeight: 'none'
                            }}
                        />
                    ) : (
                        <div className="text-white/50">Loading image...</div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 bg-[#1a1a1a] border-t border-white/10 text-xs text-white/40 text-center">
                    Scroll to zoom • Alt+Drag or Middle-click to pan • Ctrl+Z to undo • Ctrl+Shift+Z to redo
                </div>
            </div>
        </div>
    );
}
