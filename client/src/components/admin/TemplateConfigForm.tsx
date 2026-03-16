import React from 'react';
import type { TemplateConfig, TextStyle } from '../../types/template';

const FONT_OPTIONS = ['Helvetica', 'Times-Roman', 'Courier'];
const FONT_WEIGHT_OPTIONS: TextStyle['fontWeight'][] = ['normal', 'bold', 'medium', 'light'];
const TRANSFORM_OPTIONS = ['none', 'uppercase', 'lowercase', 'capitalize'];
const SECTION_TYPES = ['experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'custom', 'default'];

interface Props {
    config: TemplateConfig;
    onChange: (config: TemplateConfig) => void;
}

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 font-mono" placeholder="#000000" />
    </div>
);

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }> = ({ label, value, onChange, min, max, step = 1 }) => (
    <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
        <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(parseFloat(e.target.value))} className="w-24 text-xs border border-gray-200 rounded px-2 py-1" />
    </div>
);

const TextStyleFields: React.FC<{ label: string; value: TextStyle; onChange: (v: TextStyle) => void }> = ({ label, value, onChange }) => {
    const set = (key: keyof TextStyle, v: any) => onChange({ ...value, [key]: v });
    return (
        <details className="border border-gray-100 rounded p-2 mb-2">
            <summary className="text-xs font-medium text-gray-700 cursor-pointer">{label}</summary>
            <div className="mt-2 space-y-2">
                <NumberField label="Font size" value={value.fontSize} onChange={v => set('fontSize', v)} min={6} max={40} step={0.5} />
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24 shrink-0">Weight</label>
                    <select value={value.fontWeight} onChange={e => set('fontWeight', e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                        {FONT_WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
                <ColorField label="Color" value={value.color || ''} onChange={v => set('color', v || undefined)} />
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24 shrink-0">Transform</label>
                    <select value={value.textTransform || 'none'} onChange={e => set('textTransform', e.target.value === 'none' ? undefined : e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                        {TRANSFORM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <NumberField label="Letter spacing" value={value.letterSpacing ?? 0} onChange={v => set('letterSpacing', v || undefined)} step={0.5} />
                <NumberField label="Margin bottom" value={value.marginBottom ?? 0} onChange={v => set('marginBottom', v || undefined)} />
            </div>
        </details>
    );
};

export const TemplateConfigForm: React.FC<Props> = ({ config, onChange }) => {
    const set = (path: string, value: any) => {
        const parts = path.split('.');
        const updated = JSON.parse(JSON.stringify(config));
        let cur: any = updated;
        for (let i = 0; i < parts.length - 1; i++) {
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        onChange(updated);
    };

    const setSectionField = (sectionKey: string, field: string, value: any) => {
        const updated = JSON.parse(JSON.stringify(config));
        if (!updated.sections) updated.sections = {};
        if (!updated.sections[sectionKey]) {
            updated.sections[sectionKey] = {
                titleStyle: { fontSize: 12, fontWeight: 'bold' },
                itemStyle: { title: { fontSize: 11, fontWeight: 'bold' }, subtitle: { fontSize: 10, fontWeight: 'normal' }, date: { fontSize: 9, fontWeight: 'normal' }, description: { fontSize: 10, fontWeight: 'normal' }, marginBottom: 10 },
                layout: 'list',
            };
        }
        const parts = field.split('.');
        let cur: any = updated.sections[sectionKey];
        for (let i = 0; i < parts.length - 1; i++) {
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-4 text-sm">
            {/* Layout */}
            <section>
                <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Layout</h3>
                <div className="flex gap-2">
                    {(['single-column', 'sidebar-left', 'sidebar-right'] as const).map(l => (
                        <button key={l} onClick={() => set('layout', l)} className={`px-3 py-1.5 rounded text-xs border transition ${config.layout === l ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                            {l === 'single-column' ? 'Single Column' : l === 'sidebar-left' ? '← Sidebar Left' : 'Sidebar Right →'}
                        </button>
                    ))}
                </div>
            </section>

            {/* Theme */}
            <section>
                <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Theme</h3>
                <div className="space-y-2">
                    <ColorField label="Primary" value={config.theme.primaryColor} onChange={v => set('theme.primaryColor', v)} />
                    <ColorField label="Secondary" value={config.theme.secondaryColor} onChange={v => set('theme.secondaryColor', v)} />
                    <ColorField label="Background" value={config.theme.backgroundColor} onChange={v => set('theme.backgroundColor', v)} />
                    <ColorField label="Text" value={config.theme.textColor} onChange={v => set('theme.textColor', v)} />
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-24 shrink-0">Font family</label>
                        <select value={config.theme.fontFamily} onChange={e => set('theme.fontFamily', e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <NumberField label="Font size" value={config.theme.fontSize} onChange={v => set('theme.fontSize', v)} min={6} max={16} step={0.5} />
                    <NumberField label="Line height" value={config.theme.lineHeight} onChange={v => set('theme.lineHeight', v)} min={1} max={2.5} step={0.05} />
                </div>
            </section>

            {/* Margins */}
            <section>
                <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Margins (pt)</h3>
                <div className="grid grid-cols-2 gap-2">
                    {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                        <NumberField key={side} label={side.charAt(0).toUpperCase() + side.slice(1)} value={config.theme.margins[side]} onChange={v => set(`theme.margins.${side}`, v)} min={0} max={80} />
                    ))}
                </div>
            </section>

            {/* Header */}
            <section>
                <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Header</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-24 shrink-0">Alignment</label>
                        <div className="flex gap-1">
                            {(['left', 'centered', 'right'] as const).map(a => (
                                <button key={a} onClick={() => set('header.layout', a)} className={`px-2 py-1 rounded text-xs border ${config.header.layout === a ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-24 shrink-0">Show photo</label>
                        <input type="checkbox" checked={config.header.showPhoto} onChange={e => set('header.showPhoto', e.target.checked)} />
                    </div>
                    <TextStyleFields label="Name style" value={config.header.name} onChange={v => set('header.name', v)} />
                    <TextStyleFields label="Title style" value={config.header.title} onChange={v => set('header.title', v)} />
                </div>
            </section>

            {/* Sidebar (if applicable) */}
            {config.layout !== 'single-column' && (
                <section>
                    <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Sidebar</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 w-24 shrink-0">Width</label>
                            <input type="text" value={config.sidebar?.width || '30%'} onChange={e => set('sidebar.width', e.target.value)} className="w-24 text-xs border border-gray-200 rounded px-2 py-1" placeholder="30%" />
                        </div>
                        <ColorField label="Background" value={config.sidebar?.backgroundColor || '#f0f0f0'} onChange={v => set('sidebar.backgroundColor', v)} />
                        <ColorField label="Text color" value={config.sidebar?.textColor || '#000000'} onChange={v => set('sidebar.textColor', v)} />
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Section order (comma-separated)</label>
                            <input type="text" value={(config.sidebar?.order || []).join(', ')} onChange={e => set('sidebar.order', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full text-xs border border-gray-200 rounded px-2 py-1" placeholder="skills, languages" />
                        </div>
                    </div>
                </section>
            )}

            {/* Sections */}
            <section>
                <h3 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Section Styles</h3>
                <div className="space-y-1">
                    {SECTION_TYPES.map(sType => {
                        const sc = config.sections?.[sType];
                        if (!sc) return (
                            <div key={sType} className="flex items-center gap-2 py-1">
                                <span className="text-xs text-gray-400 flex-1">{sType} (not configured)</span>
                                <button onClick={() => setSectionField(sType, 'layout', 'list')} className="text-xs text-blue-600 hover:underline">+ Add</button>
                            </div>
                        );
                        return (
                            <details key={sType} className="border border-gray-100 rounded">
                                <summary className="text-xs font-medium text-gray-700 cursor-pointer p-2 flex items-center gap-2">
                                    <span className="capitalize">{sType}</span>
                                    <span className="text-gray-400">({sc.layout})</span>
                                </summary>
                                <div className="p-2 space-y-2 bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600 w-24 shrink-0">Layout</label>
                                        <select value={sc.layout} onChange={e => setSectionField(sType, 'layout', e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                                            <option value="list">list</option>
                                            <option value="grid">grid</option>
                                            <option value="chips">chips</option>
                                        </select>
                                    </div>
                                    {sc.layout === 'grid' && (
                                        <NumberField label="Columns" value={sc.columns || 2} onChange={v => setSectionField(sType, 'columns', v)} min={1} max={4} />
                                    )}
                                    <NumberField label="Item spacing" value={sc.itemStyle.marginBottom} onChange={v => setSectionField(sType, 'itemStyle.marginBottom', v)} min={0} max={40} />
                                    <TextStyleFields label="Title" value={sc.titleStyle} onChange={v => setSectionField(sType, 'titleStyle', v)} />
                                    <TextStyleFields label="Item title" value={sc.itemStyle.title} onChange={v => setSectionField(sType, 'itemStyle.title', v)} />
                                    <TextStyleFields label="Subtitle" value={sc.itemStyle.subtitle} onChange={v => setSectionField(sType, 'itemStyle.subtitle', v)} />
                                    <TextStyleFields label="Date" value={sc.itemStyle.date} onChange={v => setSectionField(sType, 'itemStyle.date', v)} />
                                    <TextStyleFields label="Description" value={sc.itemStyle.description} onChange={v => setSectionField(sType, 'itemStyle.description', v)} />
                                </div>
                            </details>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
