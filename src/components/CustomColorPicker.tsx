import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sliders, Grid, Ban } from 'lucide-react';
import { vibrate } from '../utils/vibrate';

export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number; // 0 to 1
  h: number; // 0 to 360
  s: number; // 0 to 100
  l: number; // 0 to 100
  hex: string; // 6-digit hex string without # or alpha, e.g. "16a34a"
}

export function parseColor(colorStr: string): ParsedColor {
  let r = 22, g = 163, b = 74, a = 1;
  const str = (colorStr || '#16a34a').trim().toLowerCase();

  if (str === 'transparent' || str === 'none') {
    return { r: 0, g: 0, b: 0, a: 0, h: 0, s: 0, l: 0, hex: '000000' };
  }

  if (str.startsWith('rgba') || str.startsWith('rgb')) {
    const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (match) {
      r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
      g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
      b = Math.min(255, Math.max(0, parseInt(match[3], 10)));
      if (match[4] !== undefined) {
        a = Math.min(1, Math.max(0, parseFloat(match[4])));
      }
    }
  } else if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16) || 0;
      g = parseInt(hex.slice(2, 4), 16) || 0;
      b = parseInt(hex.slice(4, 6), 16) || 0;
      a = Math.round(((parseInt(hex.slice(6, 8), 16) || 0) / 255) * 100) / 100;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) || 0;
      g = parseInt(hex.slice(2, 4), 16) || 0;
      b = parseInt(hex.slice(4, 6), 16) || 0;
      a = 1;
    }
  }

  // Convert RGB to HSL
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return {
    r, g, b, a,
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    hex: `${rHex}${gHex}${bHex}`
  };
}

export function formatColor(r: number, g: number, b: number, a: number): string {
  if (a <= 0) return 'transparent';
  if (a >= 1) {
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`.toLowerCase();
  }
  const roundA = Math.round(a * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${roundA})`;
}

interface CustomColorPickerProps {
  color: string;
  onChange: (newColor: string) => void;
  label?: string;
  className?: string;
  isLightMode?: boolean;
}

const PALETTE_CATEGORIES = [
  {
    name: "Special / Transparent",
    colors: ["transparent", "rgba(255,255,255,0.8)", "rgba(255,255,255,0.2)", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.3)", "rgba(99,102,241,0.5)", "rgba(236,72,153,0.5)", "rgba(16,185,129,0.5)"]
  },
  {
    name: "Vibrant",
    colors: ["#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308", "#39ff14", "#10b981", "#06b6d4", "#00f0ff", "#3b82f6", "#6366f1", "#a855f7", "#d946ef"]
  },
  {
    name: "Classic & Pastels",
    colors: ["#ffffff", "#e2e8f0", "#94a3b8", "#334155", "#09090b", "#feef8a", "#6ee7b7", "#a7f3d0", "#bae6fd", "#c7d2fe", "#f3e8ff", "#fbcfe8"]
  },
  {
    name: "Deep Canvas",
    colors: ["#120b2e", "#1c0b3a", "#043c2c", "#0a0219", "#020412", "#0f172a", "#1e293b", "#3f3f46"]
  }
];

export function CustomColorPicker({
  color,
  onChange,
  label,
  className = "",
  isLightMode = false,
}: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'swatches' | 'rgb'>('swatches');

  const parsed = useMemo(() => parseColor(color), [color]);
  const [inputVal, setInputVal] = useState(color);

  useEffect(() => {
    setInputVal(color);
  }, [color]);

  const handleInputChange = (val: string) => {
    setInputVal(val);
    const clean = val.trim();
    if (clean === 'transparent' || clean === 'none') {
      onChange('transparent');
      return;
    }
    const p = parseColor(clean);
    onChange(formatColor(p.r, p.g, p.b, p.a));
  };

  const selectColor = (swatchColor: string) => {
    vibrate('light');
    onChange(swatchColor);
    setInputVal(swatchColor);
  };

  const handleRgbChange = (r: number, g: number, b: number, a: number) => {
    const formatted = formatColor(r, g, b, a);
    onChange(formatted);
  };

  const setOpacity = (newAlpha: number) => {
    vibrate('light');
    const formatted = formatColor(parsed.r, parsed.g, parsed.b, newAlpha);
    onChange(formatted);
  };

  // Dynamic track styling
  const opaqueColorHex = `#${parsed.hex}`;
  const opacityTrackGradient = `linear-gradient(to right, transparent, ${opaqueColorHex})`;

  const isTransparent = parsed.a === 0 || color === 'transparent';

  // Display text summary in header trigger
  let displayString = `#${parsed.hex.toUpperCase()}`;
  if (isTransparent) {
    displayString = 'TRANSPARENT';
  }

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Header trigger row with collapse up/down arrow */}
      <div className="flex items-center justify-between">
        {label && <span className={`text-xs font-medium ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>{label}</span>}
        
        <button
          type="button"
          onClick={() => {
            vibrate('light');
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs select-none ${
            isOpen 
              ? (isLightMode ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold' : 'bg-zinc-800 border-indigo-500/50 text-white shadow-inner shadow-indigo-500/5') 
              : (isLightMode ? 'bg-white border-slate-300 text-slate-800 hover:border-slate-400' : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-zinc-700 hover:text-white')
          }`}
        >
          {/* Swatch indicator */}
          <div 
            className={`w-4 h-4 rounded-full border shadow-sm relative overflow-hidden ${isLightMode ? 'border-slate-300' : 'border-white/20'}`}
            style={{
              backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              backgroundColor: '#ffffff'
            }}
          >
            <div 
              className="absolute inset-0" 
              style={{ backgroundColor: color }} 
            />
          </div>

          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">{displayString}</span>
          {isOpen ? <ChevronUp size={12} className="opacity-60" /> : <ChevronDown size={12} className="opacity-60" />}
        </button>
      </div>

      {isOpen && (
        <div className={`border rounded-2xl p-4 space-y-4 animate-fade-in shadow-xl relative z-20 ${
          isLightMode ? 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md' : 'bg-zinc-900/95 border-white/10 text-white backdrop-blur-md'
        }`}>
          
          {/* Opacity section: Just the slider bar */}
          <div className={`p-2.5 rounded-xl border space-y-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className={isLightMode ? 'text-slate-700' : 'text-zinc-350'}>Opacity / Transparency</span>
              <span className="font-mono text-[11px]">{Math.round(parsed.a * 100)}%</span>
            </div>

            {/* Opacity slider with checkerboard track underlay */}
            <div className="relative flex items-center h-5">
              <div 
                className="absolute inset-0 h-2 my-auto rounded-lg overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div 
                  className="w-full h-full rounded-lg"
                  style={{ background: opacityTrackGradient }}
                />
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(parsed.a * 100)}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 relative z-10 bg-transparent"
              />
            </div>
          </div>

          {/* Tab navigation: Presets, RGB */}
          <div className="flex flex-col gap-2.5">
            <div className={`flex items-center justify-between gap-1 p-1 rounded-xl ${isLightMode ? 'bg-slate-100' : 'bg-black/40'}`}>
              <button
                type="button"
                onClick={() => { vibrate('light'); setActiveTab('swatches'); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  activeTab === 'swatches' 
                    ? (isLightMode ? 'bg-white text-slate-900 shadow-sm' : 'bg-zinc-800 text-white shadow-sm') 
                    : (isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                <Grid size={12} />
                <span>Presets</span>
              </button>
              <button
                type="button"
                onClick={() => { vibrate('light'); setActiveTab('rgb'); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  activeTab === 'rgb' 
                    ? (isLightMode ? 'bg-white text-slate-900 shadow-sm' : 'bg-zinc-800 text-white shadow-sm') 
                    : (isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                <Sliders size={12} />
                <span>RGB Sliders</span>
              </button>
            </div>

            {/* Direct code text entry with color indicator INSIDE the box on the right */}
            <div className="space-y-1">
              <label className={`text-[10px] uppercase tracking-widest block font-bold ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                Color Code Input
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="#16a34a or transparent"
                  className={`w-full border pl-3 pr-8 py-2 rounded-xl font-mono text-xs focus:border-indigo-500 focus:outline-none transition-colors ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/40 border-white/10 text-white'
                  }`}
                />

                {/* Swatch indicator INSIDE input box at the right with equal top/bottom/right padding */}
                <div 
                  className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-lg border shadow-sm overflow-hidden shrink-0 pointer-events-none z-10 ${isLightMode ? 'border-slate-300' : 'border-white/20'}`} 
                  style={{
                    backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                    backgroundSize: '6px 6px',
                    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div className="absolute inset-0" style={{ backgroundColor: color }} />
                </div>
              </div>
            </div>
          </div>

          {/* Preset Swatches View */}
          {activeTab === 'swatches' && (
            <div className="space-y-3 pt-1">
              {PALETTE_CATEGORIES.map(category => (
                <div key={category.name} className="space-y-1">
                  <span className="text-[9px] text-zinc-400 block uppercase tracking-widest font-semibold">{category.name}</span>
                  <div className="grid grid-cols-8 gap-1.5">
                    {category.colors.map(swatchColor => {
                      const isSelected = color.toLowerCase() === swatchColor.toLowerCase();
                      const isTransparentSwatch = swatchColor === 'transparent';

                      return (
                        <button
                          key={swatchColor}
                          type="button"
                          onClick={() => selectColor(swatchColor)}
                          className={`w-full aspect-square rounded-lg border relative transition-transform hover:scale-110 active:scale-90 overflow-hidden ${
                            isSelected 
                              ? 'border-indigo-500 scale-105 shadow-md z-10 ring-2 ring-indigo-500/50' 
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={{
                            backgroundImage: isTransparentSwatch || swatchColor.includes('rgba')
                              ? `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`
                              : undefined,
                            backgroundSize: '6px 6px',
                            backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                            backgroundColor: '#ffffff'
                          }}
                          title={swatchColor}
                        >
                          {!isTransparentSwatch && (
                            <div className="absolute inset-0" style={{ backgroundColor: swatchColor }} />
                          )}

                          {isTransparentSwatch && (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500">
                              <Ban size={12} className="stroke-[2.5]" />
                            </div>
                          )}

                          {isSelected && !isTransparentSwatch && (
                            <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full invert mix-blend-difference" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RGB Sliders */}
          {activeTab === 'rgb' && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center text-[10px] text-red-400 mb-1 font-semibold">
                  <span>RED</span>
                  <span className="font-mono">{parsed.r}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={parsed.r}
                  onChange={(e) => handleRgbChange(Number(e.target.value), parsed.g, parsed.b, parsed.a)}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-red-500 bg-red-950/40"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] text-emerald-400 mb-1 font-semibold">
                  <span>GREEN</span>
                  <span className="font-mono">{parsed.g}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={parsed.g}
                  onChange={(e) => handleRgbChange(parsed.r, Number(e.target.value), parsed.b, parsed.a)}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-emerald-950/40"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] text-blue-400 mb-1 font-semibold">
                  <span>BLUE</span>
                  <span className="font-mono">{parsed.b}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={parsed.b}
                  onChange={(e) => handleRgbChange(parsed.r, parsed.g, Number(e.target.value), parsed.a)}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-blue-950/40"
                />
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
