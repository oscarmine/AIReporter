import { useState } from 'react';
import { Settings, getSettings, saveSettings } from '../lib/storage';
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from '../lib/constants';

const ACCENT_COLORS = [
    { name: 'Green', value: '#4ade80' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'White', value: '#ffffff' },
];

interface SettingsViewProps {
    onClose: () => void;
}

export function SettingsView({ onClose }: SettingsViewProps) {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [apiKey, setApiKey] = useState(settings.apiKey || '');
    const [temperature, setTemperature] = useState(settings.temperature ?? 0.3);
    const [model, setModel] = useState(settings.model || 'gemini-2.5-flash');
    const [accentColor, setAccentColor] = useState(settings.accentColor || '#4ade80');
    const [customAccentColor, setCustomAccentColor] = useState('');

    const [saved, setSaved] = useState(false);

    const PREDEFINED_MODELS = [
        'gemini-2.5-flash',
        'gemini-3-flash-preview'
    ];

    const [isCustomModel, setIsCustomModel] = useState(!PREDEFINED_MODELS.includes(settings.model || 'gemini-2.5-flash'));

    const handleSave = () => {
        const finalAccentColor = (customAccentColor && /^#[0-9A-F]{6}$/i.test(customAccentColor))
            ? customAccentColor
            : accentColor;
        const newSettings: Settings = {
            ...settings,
            apiKey: apiKey.trim() || undefined,
            temperature,
            model,
            accentColor: finalAccentColor,
        };
        saveSettings(newSettings);
        setSettings(newSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 flex-shrink-0">
                <span className="text-sm font-medium text-white/50">Settings</span>
                <button
                    onClick={onClose}
                    className="text-secondary hover:text-white text-xs"
                >
                    ← Back
                </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-xl space-y-8">
                    {/* API Key Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-1">API Configuration</h3>
                        <p className="text-sm text-white/50 mb-4">
                            Configure your Gemini API key. Get one from{' '}
                            <a
                                href="https://makersuite.google.com/app/apikey"
                                target="_blank"
                                rel="noopener"
                                className="text-blue-400 hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Gemini API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIza..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI Parameters */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-1">AI Parameters</h3>
                        <p className="text-sm text-white/50 mb-4">Fine-tune the model behavior</p>

                        <div className="space-y-4">
                            {/* Model */}
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Model</label>
                                <div className="space-y-2">
                                    <select
                                        value={isCustomModel ? 'custom' : model}
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') {
                                                setIsCustomModel(true);
                                            } else {
                                                setIsCustomModel(false);
                                                setModel(e.target.value);
                                            }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                    >
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard)</option>
                                        <option value="gemini-3-flash-preview">Gemini 3.0 Flash Preview (Bleeding Edge)</option>
                                        <option value="custom">Custom / Other...</option>
                                    </select>

                                    {isCustomModel && (
                                        <input
                                            type="text"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            placeholder="e.g. gemini-1.5-pro-002"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Temperature */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-white/50">Temperature (Creativity)</label>
                                    <span className="text-xs text-white/70">{temperature}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full accent-white"
                                />
                                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                                    <span>Precise (0.0)</span>
                                    <span>Balanced (0.5)</span>
                                    <span>Creative (1.0)</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Accent Color Section */}
                    <section>
                        <h3 className="text-sm font-medium text-white/70 mb-2">Accent Color</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                {ACCENT_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => {
                                            setAccentColor(color.value);
                                            setCustomAccentColor('');
                                        }}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${(customAccentColor === '' && accentColor === color.value)
                                            ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900'
                                            : ''
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-1 w-24">
                                <span className="text-xs text-white/50 font-mono">#</span>
                                <input
                                    type="text"
                                    value={customAccentColor.replace(/^#/, '')}
                                    onChange={(e) => {
                                        const hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                        setCustomAccentColor(hex ? `#${hex}` : '');
                                    }}
                                    placeholder="FFFFFF"
                                    maxLength={6}
                                    className="bg-transparent text-xs text-white uppercase focus:outline-none font-mono w-full"
                                />
                            </div>
                        </div>
                    </section>


                    {/* About Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-1">About</h3>
                        <div className="bg-white/5 rounded-lg p-4 text-sm text-white/70">
                            <p className="font-medium text-white">{APP_NAME}</p>
                            <p className="text-xs text-white/50 mt-1">Version {APP_VERSION}</p>
                            <p className="mt-3 text-xs text-white/40">
                                {APP_DESCRIPTION}
                            </p>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={handleSave}
                            className={`
                w-full py-3 rounded-lg font-medium transition-all
                ${saved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-black hover:bg-gray-200'}
              `}
                        >
                            {saved ? '✓ Saved!' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
