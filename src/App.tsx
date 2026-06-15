import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BackgroundMaze } from './components/BackgroundMaze';
import { CustomColorPicker } from './components/CustomColorPicker';
import { generateMaze, createSeededRandom } from './utils/maze';
import { soundManager } from './utils/sounds';
import { vibrate } from './utils/vibrate';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Sliders, 
  Palette, 
  Layers, 
  Maximize2,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Laptop,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Preset {
  name: string;
  tagline: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  gradientType: 'linear' | 'radial';
  wallColor: string;
  lineWidth: number;
  accentProbability: number;
  accentPalette: string[];
  glowIntensity: number;
  showGlow: boolean;
  density: number;
}

const WALLPAPER_PRESETS: Preset[] = [
  {
    name: "Cosmic Aurora",
    tagline: "Mystic night sky with radiant glowing highlights",
    gradientStart: "#120b2e",
    gradientEnd: "#020412",
    gradientAngle: 135,
    gradientType: 'linear',
    wallColor: "#94a3b8",
    lineWidth: 1.5,
    accentProbability: 0.08,
    accentPalette: ["#ec4899", "#06b6d4", "#a855f7", "#3b82f6"], // Pink, Cyan, Violet, Blue
    glowIntensity: 5,
    showGlow: true,
    density: 35,
  },
  {
    name: "Cyberpunk Grid",
    tagline: "High-voltage neon conduits on matte carbon plate",
    gradientStart: "#030712",
    gradientEnd: "#0f172a",
    gradientAngle: 150,
    gradientType: 'linear',
    wallColor: "#334155", // Charcoal walls
    lineWidth: 1.5,
    accentProbability: 0.12,
    accentPalette: ["#39ff14", "#00ffd5", "#ff0077", "#ffff00"], // Lime, Teal, Pink, Yellow
    glowIntensity: 6,
    showGlow: true,
    density: 42,
  },
  {
    name: "Solar Horizon",
    tagline: "Fiery twilight sunset with golden architecture",
    gradientStart: "#7c123d",
    gradientEnd: "#1c0b3a",
    gradientAngle: 45,
    gradientType: 'linear',
    wallColor: "#feef8a", // Gold-yellow walls
    lineWidth: 1.8,
    accentProbability: 0.06,
    accentPalette: ["#f97316", "#ef4444", "#fbbf24", "#ea580c"], // Orange, Coral, Amber, Deep orange
    glowIntensity: 4,
    showGlow: true,
    density: 28,
  },
  {
    name: "Emerald Glow",
    tagline: "Sleek forest canopy with warm gold veins",
    gradientStart: "#043c2c",
    gradientEnd: "#011611",
    gradientAngle: 180,
    gradientType: 'linear',
    wallColor: "#6ee7b7", // Fresh mint
    lineWidth: 2.0,
    accentProbability: 0.07,
    accentPalette: ["#10b981", "#fbbf24", "#34d399", "#85e0a3"], // Emerald, Amber, Mint, Bright mint
    glowIntensity: 3,
    showGlow: true,
    density: 25,
  },
  {
    name: "Minimal Slate",
    tagline: "Sophisticated architecture with pastel conduits",
    gradientStart: "#f8fafc",
    gradientEnd: "#e2e8f0",
    gradientAngle: 90,
    gradientType: 'linear',
    wallColor: "#1e293b", // Slate-800
    lineWidth: 1.2,
    accentProbability: 0.05,
    accentPalette: ["#3b82f6", "#10b981", "#6366f1", "#f43f5e"], // Soft Blue, Soft Green, Soft Purple, Coral
    glowIntensity: 2,
    showGlow: false,
    density: 30,
  },
  {
    name: "Amethyst Rift",
    tagline: "Immersive deep purple radial singularity",
    gradientStart: "#2d0b5e",
    gradientEnd: "#0a0219",
    gradientAngle: 0,
    gradientType: 'radial',
    wallColor: "#e9d5ff", // Lilac
    lineWidth: 1.6,
    accentProbability: 0.10,
    accentPalette: ["#d946ef", "#a855f7", "#ec4899", "#818cf8"], // Magenta, Violet, Pink, Blue
    glowIntensity: 5,
    showGlow: true,
    density: 45,
  }
];

const ACCENT_PALETTES = [
  { name: "Neon Rainbow", colors: ["#ff0055", "#00ffcc", "#ffeb3b", "#39ff14", "#b026ff"] },
  { name: "Sunset Heat", colors: ["#ff4500", "#ffaa00", "#ff0077", "#ffd700"] },
  { name: "Electric Magenta", colors: ["#ff007f", "#7f00ff", "#00ffff", "#ff00ff"] },
  { name: "Tropical Fiesta", colors: ["#ff3366", "#ff9933", "#33cc66", "#3399ff"] },
  { name: "Citrus Splash", colors: ["#ff5e3a", "#ff2a68", "#ffcd00", "#00cdff"] },
  { name: "Monochrome Pop", colors: ["#ffffff", "#a1a1aa", "#52525b", "#000000"] },
  { name: "Prismatic Violet", colors: ["#a855f7", "#ec4899", "#3b82f6", "#06b6d4"] },
  { name: "Retro Synthwave", colors: ["#fe019a", "#2debff", "#ffff00", "#9d00ff"] },
  { name: "Frozen Ocean", colors: ["#00f5d4", "#00bbf9", "#00f0ff", "#3a86ff"] },
  { name: "Aurora Wave", colors: ["#05ffd9", "#00a1ff", "#9d00ff", "#ff0078"] }
];

export default function App() {
  const setActivePreset = (_: number) => {}; // dummy helper for backwards compatibility with input callbacks

  // Gradient state
  const [gradientStart, setGradientStart] = useState("#1a1a1a");
  const [gradientEnd, setGradientEnd] = useState("#0a0a0a");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientEnabled, setGradientEnabled] = useState(false);

  // Advanced Gradient controls state
  const [useThreeColors, setUseThreeColors] = useState(false);
  const [gradientMiddle, setGradientMiddle] = useState("#3f3f3f");
  const [gradientStartStop, setGradientStartStop] = useState(0);
  const [gradientMiddleStop, setGradientMiddleStop] = useState(50);
  const [gradientEndStop, setGradientEndStop] = useState(100);
  const [radialCenterX, setRadialCenterX] = useState(50);
  const [radialCenterY, setRadialCenterY] = useState(50);

  // Wall state
  const [wallColor, setWallColor] = useState("#525252");
  const [bgColor, setBgColor] = useState("#0a0a0c");
  const [lineWidth, setLineWidth] = useState(1.5);
  const [density, setDensity] = useState(35);

  // Neon highlights (Standard Plain monochrome starting maze)
  const [accentProbability, setAccentProbability] = useState(0.08);
  const [accentsEnabled, setAccentsEnabled] = useState(false);
  const [accentPalette, setAccentPalette] = useState<string[]>(["#ff0055", "#00ffcc", "#ffeb3b", "#39ff14"]);
  const [accentPaletteName, setAccentPaletteName] = useState("Neon Rainbow");
  const [glowIntensity, setGlowIntensity] = useState(4);
  const [glowSpread, setGlowSpread] = useState(0.4);
  const [showGlow, setShowGlow] = useState(false);

  // Collapsible box section expanded states (collapsed by default)
  const [gridExpanded, setGridExpanded] = useState(false);
  const [accentsExpanded, setAccentsExpanded] = useState(false);
  const [gradientExpanded, setGradientExpanded] = useState(false);
  const [exportExpanded, setExportExpanded] = useState(true);

  // General App State (Permanently disabled as requested)
  const soundEnabled = false;
  const hapticsEnabled = false;
  const [seed, setSeed] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  // Custom Sizing parameters (always active now)
  const [customWidth, setCustomWidth] = useState<string>("1920");
  const [customHeight, setCustomHeight] = useState<string>("1080");
  const exportRes = "custom"; // hardcoded custom selection as always active

  // 3D Canvas Perspective transformation states (de-activated)
  const perspectiveActive = false;
  const perspective = 1000;
  const rotateX = 0;
  const rotateY = 0;
  const rotateZ = 0;
  const scale3D = 100;

  const [windowSize, setWindowSize] = useState({ 
    w: (typeof window !== 'undefined' ? window.innerWidth : 800) || 800, 
    h: (typeof window !== 'undefined' ? window.innerHeight : 600) || 600 
  });

  // Track resizing
  useEffect(() => {
    const handleResize = () => setWindowSize({ 
      w: window.innerWidth || 800, 
      h: window.innerHeight || 600 
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update sound controller
  useEffect(() => {
    soundManager.muted = !soundEnabled;
  }, [soundEnabled]);

  // Synchronize dynamic aspect ratio maze grid dimensions
  const cols = density;
  const rows = useMemo(() => {
    if (perspectiveActive) return cols;
    const w = windowSize.w || 800;
    const h = windowSize.h || 600;
    return Math.max(5, Math.ceil(cols * (h / w)));
  }, [cols, windowSize.w, windowSize.h, perspectiveActive]);

  const effectiveAccentProbability = accentsEnabled ? accentProbability : 0;

  const handleShuffle = () => {
    if (hapticsEnabled) vibrate('heavy');
    soundManager.play('swipe');
    setSeed(s => s + 1);
  };

  const selectPalette = (palette: typeof ACCENT_PALETTES[0]) => {
    if (hapticsEnabled) vibrate('medium');
    soundManager.play('swipe');
    setAccentPaletteName(palette.name);
    setAccentPalette(palette.colors);
    if (accentsEnabled) {
      setSeed(s => s + 1); // recalculate colors
    }
  };

  // Safe canvas generation of selected resolutions
  const triggerExport = useCallback(async () => {
    setDownloading(true);
    if (hapticsEnabled) vibrate('success');
    soundManager.play('swipe');

    // Wait short delay to allow loader to show
    await new Promise(r => setTimeout(r, 600));

    try {
      const width = Math.min(8000, Math.max(200, parseInt(customWidth) || 1920));
      const height = Math.min(8000, Math.max(200, parseInt(customHeight) || 1080));

      // Generate grid matching the target aspect ratio
      const baseCols = density;
      const baseRows = perspectiveActive ? density : Math.max(5, Math.ceil(baseCols * (height / width)));

      const exportScale = perspectiveActive ? 3 : 1;
      const exportCols = baseCols * exportScale;
      const exportRows = baseRows * exportScale;

      // Call maze builder with current seed for perfect parity
      const maze = generateMaze(exportCols, exportRows, seed);

      // Create high-res offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Could not initialize canvas context");

      // Set up anti-aliasing
      ctx.imageSmoothingEnabled = true;

      // Draw background gradient
      if (!gradientEnabled) {
        ctx.fillStyle = bgColor;
      } else if (gradientType === 'radial') {
        const rcx = (radialCenterX / 100) * width;
        const rcy = (radialCenterY / 100) * height;
        const rMax = Math.max(width, height);
        const grad = ctx.createRadialGradient(rcx, rcy, 0, rcx, rcy, rMax);
        
        const stopsList = [
          { offset: gradientStartStop / 100, color: gradientStart },
          ...(useThreeColors ? [{ offset: gradientMiddleStop / 100, color: gradientMiddle }] : []),
          { offset: gradientEndStop / 100, color: gradientEnd }
        ];
        stopsList.sort((a, b) => a.offset - b.offset);
        stopsList.forEach(s => {
          const clamped = Math.max(0, Math.min(1, s.offset));
          grad.addColorStop(clamped, s.color);
        });
        ctx.fillStyle = grad;
      } else {
        const rad = (gradientAngle * Math.PI) / 180;
        const r = Math.sqrt(width**2 + height**2) / 2;
        const cx = width / 2;
        const cy = height / 2;
        const x0 = cx - Math.cos(rad) * r;
        const y0 = cy - Math.sin(rad) * r;
        const x1 = cx + Math.cos(rad) * r;
        const y1 = cy + Math.sin(rad) * r;

        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        const stopsList = [
          { offset: gradientStartStop / 100, color: gradientStart },
          ...(useThreeColors ? [{ offset: gradientMiddleStop / 100, color: gradientMiddle }] : []),
          { offset: gradientEndStop / 100, color: gradientEnd }
        ];
        stopsList.sort((a, b) => a.offset - b.offset);
        stopsList.forEach(s => {
          const clamped = Math.max(0, Math.min(1, s.offset));
          grad.addColorStop(clamped, s.color);
        });
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, width, height);

      // Coordinate translators matching BackgroundMaze logic mathematically to prevent any squishing
      const scaleX = width / baseCols;
      const scaleY = height / baseRows;
      const cellSize = Math.max(scaleX, scaleY);

      // Line scale ratio translation
      // Compare current viewport layout scale vs export sizing
      const currentScaleX = windowSize.w / cols;
      const currentScaleY = windowSize.h / rows;
      const currentCellSize = Math.max(currentScaleX, currentScaleY);
      const scaleMultiplier = cellSize / currentCellSize;
      const exportLineWidth = Math.max(0.75, lineWidth * scaleMultiplier);

      const getX = (gx: number) => (gx - exportCols / 2) * cellSize + width / 2;
      const getY = (gy: number) => (gy - exportRows / 2) * cellSize + height / 2;

      const rx = ((perspectiveActive ? rotateX : 0) * Math.PI) / 180;
      const ry = ((perspectiveActive ? rotateY : 0) * Math.PI) / 180;
      const rz = ((perspectiveActive ? rotateZ : 0) * Math.PI) / 180;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);

      const cx = width / 2;
      const cy = height / 2;

      const projectPoint = (x: number, y: number) => {
        if (!perspectiveActive) {
          return { x, y, z: 0 };
        }
        // Center-relative coordinates
        const x_rel = x - cx;
        const y_rel = y - cy;

        // Apply 3D Scale
        const x1 = x_rel * (scale3D / 100);
        const y1 = y_rel * (scale3D / 100);
        const z1 = 0;

        // Rotate about Z-axis (Roll)
        const x2 = x1 * cosZ - y1 * sinZ;
        const y2 = x1 * sinZ + y1 * cosZ;
        const z2 = z1;

        // Rotate about Y-axis (Yaw)
        const x3 = x2 * cosY + z2 * sinY;
        const y3 = y2;
        const z3 = -x2 * sinY + z2 * cosY;

        // Rotate about X-axis (Pitch)
        const x4 = x3;
        const y4 = y3 * cosX - z3 * sinX;
        const z4 = y3 * sinX + z3 * cosX;

        // Perspective Projection
        const denom = perspective - z4;
        const f = denom <= 40 ? 5000 : perspective / denom;

        const px = cx + x4 * f;
        const py = cy + y4 * f;

        return { x: px, y: py, z: z4 };
      };

      const defaultWalls: { x1: number, y1: number, x2: number, y2: number }[] = [];
      const accentWalls: Record<string, { x1: number, y1: number, x2: number, y2: number }[]> = {};
      
      accentPalette.forEach(c => {
        accentWalls[c] = [];
      });

      const random = createSeededRandom(seed + 100);

      const addWall = (x1: number, y1: number, x2: number, y2: number) => {
        if (effectiveAccentProbability > 0 && random() < effectiveAccentProbability && accentPalette.length > 0) {
          const color = accentPalette[Math.floor(random() * accentPalette.length)];
          accentWalls[color].push({ x1, y1, x2, y2 });
        } else {
          defaultWalls.push({ x1, y1, x2, y2 });
        }
      };

      // Assemble all lines
      // Outers
      for (let y = 0; y < exportRows; y++) addWall(0, y, 0, y + 1);
      for (let x = 0; x < exportCols; x++) addWall(x, 0, x + 1, 0);
      
      // Inners
      for (let y = 0; y < exportRows; y++) {
        for (let x = 0; x < exportCols; x++) {
          const cell = maze[y][x];
          if (cell.walls.right) addWall(x + 1, y, x + 1, y + 1);
          if (cell.walls.bottom) addWall(x, y + 1, x + 1, y + 1);
        }
      }

      // Draw Normal Walls
      defaultWalls.forEach(w => {
        const p1 = projectPoint(getX(w.x1), getY(w.y1));
        const p2 = projectPoint(getX(w.x2), getY(w.y2));

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = wallColor;

        if (perspectiveActive) {
          const f1 = perspective / (perspective - p1.z);
          const f2 = perspective / (perspective - p2.z);
          const f = (f1 + f2) / 2;
          ctx.lineWidth = Math.max(0.5, exportLineWidth * f);
        } else {
          ctx.lineWidth = exportLineWidth;
        }

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw Accent Glowing Walls
      Object.entries(accentWalls).forEach(([color, walls]) => {
        if (walls.length === 0) return;

        // Overlay base bloom blur path if glow is toggled
        if (showGlow) {
          // Pass 1: Outer wide soft bloom
          walls.forEach(w => {
            const p1 = projectPoint(getX(w.x1), getY(w.y1));
            const p2 = projectPoint(getX(w.x2), getY(w.y2));

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = color;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            let f = 1;
            if (perspectiveActive) {
              const f1 = perspective / (perspective - p1.z);
              const f2 = perspective / (perspective - p2.z);
              f = (f1 + f2) / 2;
            }

            // Wider soft blur representing the outer glow area
            ctx.shadowBlur = glowIntensity * glowSpread * scaleMultiplier * f * 3.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = exportLineWidth * 1.6 * f;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          });

          // Pass 2: Medium tight intense halo
          walls.forEach(w => {
            const p1 = projectPoint(getX(w.x1), getY(w.y1));
            const p2 = projectPoint(getX(w.x2), getY(w.y2));

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = color;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            let f = 1;
            if (perspectiveActive) {
              const f1 = perspective / (perspective - p1.z);
              const f2 = perspective / (perspective - p2.z);
              f = (f1 + f2) / 2;
            }

            // Tighter intense blur close to the wire
            ctx.shadowBlur = glowIntensity * glowSpread * scaleMultiplier * f * 1.2;
            ctx.strokeStyle = color;
            ctx.lineWidth = exportLineWidth * 1.2 * f;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          });
        }

        // Clean intense core path
        walls.forEach(w => {
          const p1 = projectPoint(getX(w.x1), getY(w.y1));
          const p2 = projectPoint(getX(w.x2), getY(w.y2));

          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = color;

          let f = 1;
          if (perspectiveActive) {
            const f1 = perspective / (perspective - p1.z);
            const f2 = perspective / (perspective - p2.z);
            f = (f1 + f2) / 2;
          }

          ctx.lineWidth = exportLineWidth * f;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        });
      });

      // Output downloader trigger
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = `escape_maze_${width}x${height}_wallpaper.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);

        if (hapticsEnabled) vibrate('success');
        soundManager.play('success');
        setShowDownloadSuccess(true);
        setTimeout(() => setShowDownloadSuccess(false), 5000);
      }, 'image/png');

    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }, [
    density,
    exportRes,
    customWidth,
    customHeight,
    gradientStart,
    gradientEnd,
    gradientAngle,
    gradientType,
    useThreeColors,
    gradientMiddle,
    gradientStartStop,
    gradientMiddleStop,
    gradientEndStop,
    radialCenterX,
    radialCenterY,
    gradientEnabled,
    wallColor,
    bgColor,
    lineWidth,
    accentProbability,
    accentsEnabled,
    effectiveAccentProbability,
    accentPalette,
    glowIntensity,
    glowSpread,
    showGlow,
    windowSize,
    hapticsEnabled,
    perspectiveActive,
    perspective,
    rotateX,
    rotateY,
    rotateZ,
    scale3D
  ]);

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative font-sans select-none bg-neutral-900 text-white">
      {/* Dynamic Render Canvas Overlay */}
      <BackgroundMaze 
        cols={cols}
        rows={rows}
        cellSize={0} // calculated internally dynamically using width/height ratios
        wallColor={wallColor}
        lineWidth={lineWidth}
        gradientStart={gradientStart}
        gradientEnd={gradientEnd}
        gradientAngle={gradientAngle}
        gradientType={gradientType}
        gradientMiddle={gradientMiddle}
        useThreeColors={useThreeColors}
        gradientStartStop={gradientStartStop}
        gradientMiddleStop={gradientMiddleStop}
        gradientEndStop={gradientEndStop}
        radialCenterX={radialCenterX}
        radialCenterY={radialCenterY}
        accentProbability={effectiveAccentProbability}
        accentPalette={accentPalette}
        glowIntensity={glowIntensity}
        seed={seed}
        showGlow={showGlow}
        perspective={perspectiveActive ? perspective : 1000}
        rotateX={perspectiveActive ? rotateX : 0}
        rotateY={perspectiveActive ? rotateY : 0}
        rotateZ={perspectiveActive ? rotateZ : 0}
        scale3D={scale3D}
        perspectiveActive={perspectiveActive}
        gradientEnabled={gradientEnabled}
        bgColor={bgColor}
        glowSpread={glowSpread}
      />

      {/* Ambient background clicks overlay to bring editor back */}
      {!showControls ? (
        <div 
          onClick={() => {
            if (hapticsEnabled) vibrate('medium');
            soundManager.play('swipe');
            setShowControls(true);
          }}
          className="absolute inset-0 z-10 cursor-pointer flex flex-col justify-between p-6 pointer-events-auto"
        >
          <div className="w-full flex justify-end">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              whileHover={{ opacity: 0.8, scale: 1.05 }}
              className="bg-black/40 text-white/90 border border-white/10 px-4 py-2.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg"
            >
              <Eye size={16} />
              <span className="text-xs font-medium tracking-wide">Show Designer Panel</span>
            </motion.button>
          </div>
          <div className="text-center pb-4 text-white/20 text-xs font-mono select-none pointer-events-none">
            Tap anywhere to return controls panel
          </div>
        </div>
      ) : (
        /* Transparent backdrop overlay under the controls panel to allow clicking the wallpaper to close the menu */
        <div 
          onClick={() => {
            if (hapticsEnabled) vibrate('light');
            soundManager.play('swipe');
            setShowControls(false);
          }}
          className="absolute inset-0 z-10 cursor-pointer pointer-events-auto bg-transparent"
        />
      )}

      {/* Main Designer Floating Panel Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 120, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-4 right-4 bottom-4 h-[65%] sm:h-auto sm:left-auto sm:right-4 sm:top-4 sm:bottom-4 w-auto sm:w-[380px] max-w-[calc(100vw-2rem)] bg-neutral-950/80 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col z-20 overflow-hidden backdrop-blur-xl"
          >
            {/* Fixed Close/Eye Button on Top Right */}
            <div className="absolute top-5 right-5 z-25">
              <button 
                onClick={() => {
                  if (hapticsEnabled) vibrate('heavy');
                  soundManager.play('swipe');
                  setShowControls(false);
                }}
                className="p-1 px-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                title="Hide menu editor"
              >
                <EyeOff size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Layout Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">

              {/* Title & Promotion Subtext (Scrollable) */}
              <div className="space-y-1.5 pr-8">
                <div className="flex items-center text-md font-bold text-white select-none leading-none">
                  <a
                    href="https://github.com/OngrassTech/scape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center text-md font-bold text-white hover:text-indigo-300 h-8 px-3 rounded-xl border border-zinc-700/60 bg-zinc-800 hover:bg-zinc-750 active:scale-95 transition-all shadow-sm leading-none"
                  >
                    Scape
                  </a>
                  <span className="leading-none ml-1 text-md font-bold text-white">Wallpaper</span>
                </div>

                {/* Game Info Promotion Subtext directly below title with small lighter font, no separator */}
                <div className="text-[9px] text-zinc-500 font-light leading-normal select-none px-0.5">
                  Scape is my android game that i used to make this wallpaper website, download and play from the scape button above
                </div>
              </div>

              {/* Maze Settings Section */}
              <div className="space-y-3">
                <div 
                  onClick={() => {
                    if (hapticsEnabled) vibrate('light');
                    soundManager.play('swipe');
                    setGridExpanded(prev => !prev);
                  }}
                  className="flex items-center justify-between cursor-pointer select-none group py-1"
                >
                  <div className="flex items-center gap-1.5 text-zinc-350 group-hover:text-white transition-colors">
                    <Sliders size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Maze structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gridExpanded && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                           handleShuffle();
                        }}
                        className="p-1 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] hover:bg-zinc-800 active:scale-95 transition-all"
                      >
                        <RefreshCw size={10} className="animate-spin-hover" />
                        <span>Regen</span>
                      </button>
                    )}
                    {gridExpanded ? (
                      <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    ) : (
                      <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Sizing grid elements sliders */}
                {gridExpanded && (
                  <div className="space-y-4 bg-white/[0.01] p-3.5 rounded-2xl border border-white/5">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-zinc-400">Maze density / Cell Count</span>
                        <span className="text-zinc-200 font-mono font-bold">{density} cols</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="75" 
                        value={density}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDensity(val);
                          if (hapticsEnabled && val % 5 === 0) vibrate('light');
                        }}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-zinc-400">Wall Wire Width</span>
                        <span className="text-zinc-200 font-mono font-bold">{lineWidth} px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="15.0" 
                        step="0.1" 
                        value={lineWidth}
                        onChange={(e) => {
                          setLineWidth(Number(e.target.value));
                        }}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <CustomColorPicker
                        color={wallColor}
                        onChange={(newColor) => {
                          setWallColor(newColor);
                          setActivePreset(-1); // user customized
                        }}
                        label="Maze Color"
                      />
                      
                      <CustomColorPicker
                        color={bgColor}
                        onChange={(newColor) => {
                          setBgColor(newColor);
                          setActivePreset(-1); // user customized
                        }}
                        label="Background Color"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Scattered Wall Accents Highlight Option (Moved right below grid structure) */}
              <div className="space-y-4 border-t border-white/5 pt-5">
                <div 
                  onClick={() => {
                    if (hapticsEnabled) vibrate('light');
                    soundManager.play('swipe');
                    setAccentsExpanded(prev => !prev);
                  }}
                  className="flex items-center justify-between cursor-pointer select-none group py-1"
                >
                  <div className="flex items-center gap-1.5 text-zinc-350 group-hover:text-white transition-colors">
                    <Layers size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Accents</span>
                  </div>
                  
                  {/* Chevron only */}
                  <div className="flex items-center gap-3">
                    {accentsExpanded ? (
                      <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    ) : (
                      <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </div>

                {accentsExpanded && (
                  <div className="space-y-4 bg-white/[0.01] p-3.5 rounded-2xl border border-white/5">
                    {/* Toggle Highlighted Accents inside */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Highlighted accents</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (hapticsEnabled) vibrate('medium');
                          soundManager.play('swipe');
                          setAccentsEnabled(prev => !prev);
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all border ${
                          accentsEnabled ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-700'
                        }`}
                        title={accentsEnabled ? "Disable Highlights" : "Enable Highlights"}
                      >
                        <div 
                          className={`w-4 h-4 rounded-full shadow-sm transition-all bg-white ${
                            accentsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Prob Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-zinc-400">Accent Scattering</span>
                        <span className="text-zinc-200 font-mono font-bold">{Math.round(accentProbability * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.02" 
                        max="0.75" 
                        step="0.01"
                        value={accentProbability}
                        onChange={(e) => {
                          setAccentProbability(Number(e.target.value));
                        }}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                    </div>

                    {/* Accent glowing toggle */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-xs text-zinc-400">Accent Glow</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (hapticsEnabled) vibrate('light');
                          soundManager.play('swipe');
                          setShowGlow(!showGlow);
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all border ${
                          showGlow ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-700'
                        }`}
                      >
                        <div 
                          className={`w-4 h-4 rounded-full shadow-sm transition-all bg-white ${
                            showGlow ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {showGlow && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-zinc-400">Glow Intensity</span>
                            <span className="text-zinc-200 font-mono font-bold">{glowIntensity.toFixed(1)}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="30.0" 
                            step="0.1"
                            value={glowIntensity}
                            onChange={(e) => {
                              setGlowIntensity(Number(e.target.value));
                            }}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-zinc-400">Glow Spread / Softness</span>
                            <span className="text-zinc-200 font-mono font-bold">{glowSpread.toFixed(2)}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.10" 
                            max="2.00" 
                            step="0.05"
                            value={glowSpread}
                            onChange={(e) => {
                              setGlowSpread(Number(e.target.value));
                            }}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Neon Preset Palettes choice */}
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] text-zinc-500 block mb-2 uppercase tracking-wider">Highlight Colors</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {ACCENT_PALETTES.map(p => (
                          <button
                            key={p.name}
                            onClick={() => selectPalette(p)}
                            className={`flex items-center gap-1 p-1 pr-2.5 rounded-lg border text-[10px] transition-colors ${
                              accentPaletteName === p.name 
                                ? 'bg-zinc-800 text-white border-zinc-700' 
                                : 'bg-zinc-900/50 text-zinc-400 border-transparent hover:text-zinc-300'
                            }`}
                          >
                            <div className="flex gap-0.5">
                              {p.colors.slice(0, 4).map((col, cIdx) => (
                                <div key={cIdx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col }} />
                              ))}
                            </div>
                            <span className="font-medium">{p.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Manual Custom Palette Editor */}
                      <span className="text-[10px] text-zinc-500 block mb-2 uppercase tracking-wider mt-4">Manually Customize Accent Colors</span>
                      <div className="space-y-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div className="space-y-3">
                          {accentPalette.map((color, idx) => (
                            <div 
                              key={idx}
                              className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Accent #{idx + 1}</span>
                                {accentPalette.length > 1 && (
                                  <button
                                    onClick={() => {
                                      if (hapticsEnabled) vibrate('light');
                                      const updatedColors = accentPalette.filter((_, i) => i !== idx);
                                      setAccentPalette(updatedColors);
                                      setAccentPaletteName("Manual Set");
                                    }}
                                    className="text-[10px] text-zinc-300 hover:text-red-400 px-2 py-0.5 rounded-lg border border-zinc-700/60 bg-zinc-800 hover:bg-zinc-750 active:scale-95 transition-all shadow-sm"
                                    title="Remove color swatch"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <CustomColorPicker 
                                color={color} 
                                onChange={(newColor) => {
                                  const updatedColors = [...accentPalette];
                                  updatedColors[idx] = newColor;
                                  setAccentPalette(updatedColors);
                                  setAccentPaletteName("Manual Set");
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            if (hapticsEnabled) vibrate('light');
                            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                            setAccentPalette([...accentPalette, randomColor]);
                            setAccentPaletteName("Manual Set");
                          }}
                          className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-500/30 hover:border-indigo-500/50 py-2 rounded-xl transition-all h-9 flex items-center justify-center gap-1.5"
                        >
                          <span>+ Add Accent Color</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Background gradient customization panel */}
              <div className="space-y-4 border-t border-white/5 pt-5">
                <div 
                  onClick={() => {
                    if (hapticsEnabled) vibrate('light');
                    soundManager.play('swipe');
                    setGradientExpanded(prev => !prev);
                  }}
                  className="flex items-center justify-between cursor-pointer select-none group py-1"
                >
                  <div className="flex items-center gap-1.5 text-zinc-355 group-hover:text-white transition-colors">
                    <Palette size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Canvas gradient</span>
                  </div>
                  {gradientExpanded ? (
                    <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  ) : (
                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  )}
                </div>

                {gradientExpanded && (
                  <div className="space-y-3.5 bg-white/[0.01] p-3.5 rounded-2xl border border-white/5">
                    {/* Toggle Canvas Gradient inside */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Enable Canvas Gradient</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (hapticsEnabled) vibrate('medium');
                          soundManager.play('swipe');
                          setGradientEnabled(prev => !prev);
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all border ${
                          gradientEnabled ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-700'
                        }`}
                        title={gradientEnabled ? "Disable Canvas Gradient" : "Enable Canvas Gradient"}
                      >
                        <div 
                          className={`w-4 h-4 rounded-full shadow-sm transition-all bg-white ${
                            gradientEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Linear / Radial Mode */}
                    <div className="flex gap-1.5 bg-zinc-900/60 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          if (hapticsEnabled) vibrate('light');
                          soundManager.play('swipe');
                          setGradientType('linear');
                          setActivePreset(-1);
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          gradientType === 'linear' 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Linear Layout
                      </button>
                      <button
                        onClick={() => {
                          if (hapticsEnabled) vibrate('light');
                          soundManager.play('swipe');
                          setGradientType('radial');
                          setActivePreset(-1);
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          gradientType === 'radial' 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Radial Gradient
                      </button>
                    </div>

                    {/* Gradient Angle (for Linear Gradient) */}
                    {gradientType === 'linear' && (
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-zinc-400">Gradient Angle</span>
                          <span className="text-zinc-200 font-mono font-bold">{gradientAngle}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          value={gradientAngle}
                          onChange={(e) => {
                            setGradientAngle(Number(e.target.value));
                            setActivePreset(-1);
                          }}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    )}

                    {/* Radial Center position sliders */}
                    {gradientType === 'radial' && (
                      <div className="space-y-3 pb-1 border-b border-white/5">
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-zinc-400">Radial Center X</span>
                            <span className="text-zinc-200 font-mono font-bold">{radialCenterX}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={radialCenterX}
                            onChange={(e) => {
                              setRadialCenterX(Number(e.target.value));
                              setActivePreset(-1);
                            }}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-zinc-400">Radial Center Y</span>
                            <span className="text-zinc-200 font-mono font-bold">{radialCenterY}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={radialCenterY}
                            onChange={(e) => {
                              setRadialCenterY(Number(e.target.value));
                              setActivePreset(-1);
                            }}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Three-Color Gradient Toggle */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-zinc-400">Three-Color Gradient (via middle step)</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (hapticsEnabled) vibrate('light');
                          soundManager.play('swipe');
                          setUseThreeColors(prev => !prev);
                          setActivePreset(-1);
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all ${
                          useThreeColors ? 'bg-indigo-500' : 'bg-zinc-800 border border-zinc-700'
                        }`}
                      >
                        <div 
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                            useThreeColors ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Gradient Color & Location Controls */}
                    <div className="space-y-4 pt-1">
                      {/* Start Gradient */}
                      <div className="space-y-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <CustomColorPicker
                          color={gradientStart}
                          onChange={(newColor) => {
                            setGradientStart(newColor);
                            setActivePreset(-1); // user customized
                          }}
                          label="Start Gradient Color"
                        />
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>Start Position</span>
                            <span className="font-mono">{gradientStartStop}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={gradientStartStop}
                            onChange={(e) => {
                              setGradientStartStop(Number(e.target.value));
                              setActivePreset(-1);
                            }}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          />
                        </div>
                      </div>

                      {/* Middle Gradient */}
                      {useThreeColors && (
                        <div className="space-y-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <CustomColorPicker
                            color={gradientMiddle}
                            onChange={(newColor) => {
                              setGradientMiddle(newColor);
                              setActivePreset(-1); // user customized
                            }}
                            label="Middle Via Color"
                          />
                          <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                              <span>Middle Position</span>
                              <span className="font-mono">{gradientMiddleStop}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={gradientMiddleStop}
                              onChange={(e) => {
                                setGradientMiddleStop(Number(e.target.value));
                                setActivePreset(-1);
                              }}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* End Gradient */}
                      <div className="space-y-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <CustomColorPicker
                          color={gradientEnd}
                          onChange={(newColor) => {
                            setGradientEnd(newColor);
                            setActivePreset(-1); // user customized
                          }}
                          label="End Gradient Color"
                        />
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>End Position</span>
                            <span className="font-mono">{gradientEndStop}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={gradientEndStop}
                            onChange={(e) => {
                              setGradientEndStop(Number(e.target.value));
                              setActivePreset(-1);
                            }}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Download and select resolution UI */}
              <div className="space-y-4 border-t border-white/5 pt-5 pb-2">
                <div 
                  onClick={() => {
                    if (hapticsEnabled) vibrate('light');
                    soundManager.play('swipe');
                    setExportExpanded(prev => !prev);
                  }}
                  className="flex items-center justify-between cursor-pointer select-none group py-1"
                >
                  <div className="flex items-center gap-1.5 text-zinc-350 group-hover:text-white transition-colors">
                    <Maximize2 size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Export Size</span>
                  </div>
                  {exportExpanded ? (
                    <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  ) : (
                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  )}
                </div>

                {exportExpanded && (
                  <div className="space-y-3 bg-white/[0.01] p-3.5 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-zinc-450 block uppercase tracking-wider font-bold mb-1 px-0.5 select-none">
                      Manually Input Size
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-0.5">
                      <div>
                        <span className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wider">Width (px)</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-zinc-900 border border-white/5 p-2 rounded-xl text-xs text-white text-center font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wider">Height (px)</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-zinc-900 border border-white/5 p-2 rounded-xl text-xs text-white text-center font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Button Actions */}
            <div className="px-6 py-5 border-t border-white/5 bg-zinc-950 flex flex-col gap-2 shrink-0">
              {/* Success Notification Alert */}
              <AnimatePresence>
                {showDownloadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-emerald-400 mb-1"
                  >
                    <CheckCircle size={14} className="shrink-0" />
                    <span className="text-xs font-medium">Wallpaper downloaded successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={triggerExport}
                disabled={downloading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:cursor-not-allowed select-none text-xs"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Downloading Wallpaper...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download Wallpaper</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
