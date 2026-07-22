import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Sliders, Grid } from 'lucide-react';
import { vibrate } from '../utils/vibrate';

// Helper to convert hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Normalize hex string
  let hStr = hex.replace(/^#/, '');
  if (hStr.length === 3) {
    hStr = hStr.split('').map(x => x + x).join('');
  }
  if (hStr.length !== 6) {
    return { h: 0, s: 100, l: 50 };
  }
  const r = parseInt(hStr.slice(0, 2), 16) / 255;
  const g = parseInt(hStr.slice(2, 4), 16) / 255;
  const b = parseInt(hStr.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Helper to convert HSL to hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toLowerCase();
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
  const [inputVal, setInputVal] = useState(color);
  const [activeTab, setActiveTab] = useState<'swatches' | 'sliders'>('swatches');

  // Parse custom colors to sliders
  const HslMap = useMemo(() => {
    return hexToHsl(color);
  }, [color]);

  // Synchronize internal state input values
  useEffect(() => {
    setInputVal(color);
  }, [color]);

  const handleHexChange = (val: string) => {
    setInputVal(val);
    
    // Clean and validate hex sequence
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) {
      cleanHex = '#' + cleanHex;
    }

    const isValid = /^#[0-9A-F]{6}$/i.test(cleanHex) || /^#[0-9A-F]{3}$/i.test(cleanHex);
    if (isValid) {
      onChange(cleanHex.toLowerCase());
    }
  };

  const selectColor = (swatchColor: string) => {
    vibrate('light');
    onChange(swatchColor);
    setInputVal(swatchColor);
  };

  const handleHslSliderChange = (type: 'h' | 's' | 'l', value: number) => {
    const updatedHsl = { ...HslMap, [type]: value };
    const exactHex = hslToHex(updatedHsl.h, updatedHsl.s, updatedHsl.l);
    onChange(exactHex);
    setInputVal(exactHex);
  };

  // Generate tracks dynamic gradient background styles for Saturation/Lightness sliders
  const sTrackStyle = {
    background: `linear-gradient(to right, hsl(${HslMap.h}, 0%, ${HslMap.l}%), hsl(${HslMap.h}, 100%, ${HslMap.l}%))`
  };

  const lTrackStyle = {
    background: `linear-gradient(to right, #000000 0%, hsl(${HslMap.h}, ${HslMap.s}%, 50%) 50%, #ffffff 100%)`
  };

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Selector summary row */}
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
          <div 
            className={`w-4 h-4 rounded-full border shadow-sm ${isLightMode ? 'border-slate-300' : 'border-white/10'}`}
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-[11px] uppercase tracking-wider">{color}</span>
          {isOpen ? <ChevronUp size={12} className="opacity-60" /> : <ChevronDown size={12} className="opacity-60" />}
        </button>
      </div>

      {isOpen && (
        <div className={`border rounded-2xl p-4.5 space-y-4 animate-fade-in shadow-xl relative z-10 ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-white/10 text-white'
        }`}>
          
          {/* Header tabs controls and paste direct input code field */}
          <div className="flex flex-col gap-3">
            <div className={`flex items-center justify-between gap-2 p-1 rounded-xl ${isLightMode ? 'bg-slate-100' : 'bg-black/30'}`}>
              <button
                type="button"
                onClick={() => { vibrate('light'); setActiveTab('swatches'); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeTab === 'swatches' 
                    ? (isLightMode ? 'bg-white text-slate-900 shadow' : 'bg-zinc-800 text-white shadow') 
                    : (isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                <Grid size={12} />
                <span>Presets</span>
              </button>
              <button
                type="button"
                onClick={() => { vibrate('light'); setActiveTab('sliders'); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeTab === 'sliders' 
                    ? (isLightMode ? 'bg-white text-slate-900 shadow' : 'bg-zinc-800 text-white shadow') 
                    : (isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                }`}
              >
                <Sliders size={12} />
                <span>Sliders (HSL)</span>
              </button>
            </div>

            {/* Direct exact Hex text entry */}
            <div className="space-y-1">
              <label className={`text-[10px] uppercase tracking-widest block font-semibold ${isLightMode ? 'text-slate-500' : 'text-zinc-500'}`}>Enter Exact HEX Color value</label>
              <div className="relative flex items-center">
                <span className={`absolute left-3 font-mono text-xs select-none ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>#</span>
                <input
                  type="text"
                  value={inputVal.replace(/^#/, '')}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="FF0055"
                  maxLength={7}
                  className={`w-full border pl-7 pr-3 py-1.5 rounded-xl font-mono text-xs uppercase focus:border-indigo-500 focus:outline-none transition-colors ${
                    isLightMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/40 border-white/5 text-white'
                  }`}
                />
                <div 
                  className={`absolute right-2 w-5 h-5 rounded-md border ${isLightMode ? 'border-slate-300' : 'border-white/10'}`} 
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>

          {/* Preset Swatches Layout */}
          {activeTab === 'swatches' && (
            <div className="space-y-3 pt-1">
              {PALETTE_CATEGORIES.map(category => (
                <div key={category.name} className="space-y-1">
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-widest">{category.name}</span>
                  <div className="grid grid-cols-8 gap-1.5">
                    {category.colors.map(swatchColor => (
                      <button
                        key={swatchColor}
                        type="button"
                        onClick={() => selectColor(swatchColor)}
                        className={`w-full aspect-square rounded-lg border relative transition-transform hover:scale-110 active:scale-90 ${
                          color.toLowerCase() === swatchColor.toLowerCase() 
                            ? 'border-white scale-105 shadow-md shadow-white/10 z-10' 
                            : 'border-white/5 hover:border-white/20'
                        }`}
                        style={{ backgroundColor: swatchColor }}
                        title={swatchColor}
                      >
                        {color.toLowerCase() === swatchColor.toLowerCase() && (
                          <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full invert mix-blend-difference" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* High Fidelity Interactive Color Tuning Sliders */}
          {activeTab === 'sliders' && (
            <div className="space-y-3.5 pt-1">
              {/* Hue slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                  <span>HUE (Color Tone)</span>
                  <span className="font-mono">{HslMap.h}°</span>
                </div>
                <div className="relative flex items-center h-4">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={HslMap.h}
                    onChange={(e) => handleHslSliderChange('h', Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                    style={{
                      background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                    }}
                  />
                </div>
              </div>

              {/* Saturation slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                  <span>SATURATION (Vibrancy)</span>
                  <span className="font-mono">{HslMap.s}%</span>
                </div>
                <div className="relative flex items-center h-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={HslMap.s}
                    onChange={(e) => handleHslSliderChange('s', Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                    style={sTrackStyle}
                  />
                </div>
              </div>

              {/* Lightness slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                  <span>LIGHTNESS (Brightness & Dark)</span>
                  <span className="font-mono">{HslMap.l}%</span>
                </div>
                <div className="relative flex items-center h-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={HslMap.l}
                    onChange={(e) => handleHslSliderChange('l', Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                    style={lTrackStyle}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
