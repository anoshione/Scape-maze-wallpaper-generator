import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMaze, createSeededRandom } from '../utils/maze';

interface BackgroundMazeProps {
  cols: number;
  rows: number;
  cellSize: number;
  wallColor: string;
  lineWidth: number;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  gradientType: 'linear' | 'radial';
  accentProbability: number;
  accentPalette: string[];
  glowIntensity: number;
  seed: number;
  showGlow: boolean;
  gradientMiddle?: string;
  useThreeColors?: boolean;
  gradientStartStop?: number;
  gradientMiddleStop?: number;
  gradientEndStop?: number;
  radialCenterX?: number;
  radialCenterY?: number;
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale3D?: number;
  perspectiveActive?: boolean;
  gradientEnabled?: boolean;
  bgColor?: string;
  glowSpread?: number;
}

export function BackgroundMaze({
  cols,
  rows,
  cellSize,
  wallColor,
  lineWidth,
  gradientStart,
  gradientEnd,
  gradientAngle,
  gradientType,
  accentProbability,
  accentPalette,
  glowIntensity,
  seed,
  showGlow,
  gradientMiddle = "#6366f1",
  useThreeColors = false,
  gradientStartStop = 0,
  gradientMiddleStop = 50,
  gradientEndStop = 100,
  radialCenterX = 50,
  radialCenterY = 50,
  perspective = 1000,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale3D = 100,
  perspectiveActive = false,
  gradientEnabled = false,
  bgColor = "#0a0a0c",
  glowSpread = 0.4,
}: BackgroundMazeProps) {
  const [windowSize, setWindowSize] = useState({ 
    w: (typeof window !== 'undefined' ? window.innerWidth : 800) || 800, 
    h: (typeof window !== 'undefined' ? window.innerHeight : 600) || 600 
  });

  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWindowSize({ 
          w: window.innerWidth || 800, 
          h: window.innerHeight || 600 
        });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const activeCols = perspectiveActive ? cols * 3 : cols;
  const activeRows = perspectiveActive ? rows * 3 : rows;

  // Compute maze structure and partition walls into default/accent lists.
  // We use keying on [activeCols, activeRows, seed, accentProbability, accentPalette]
  // so that the walls stay pinned while dragging gradient/color/line-width sliders!
  const mazePaths = useMemo(() => {
    if (
      !activeCols || 
      !activeRows || 
      isNaN(activeCols) || 
      isNaN(activeRows) || 
      !isFinite(activeCols) || 
      !isFinite(activeRows) || 
      activeCols < 3 || 
      activeRows < 3
    ) {
      return null;
    }

    const maze = generateMaze(activeCols, activeRows, seed);
    if (!maze || maze.length === 0) return null;

    const segments: { d: string }[] = [];

    // Left perimeter boundary
    for (let y = 0; y < activeRows; y++) {
      segments.push({ d: `M 0 ${y} L 0 ${y + 1}` });
    }
    // Top perimeter boundary
    for (let x = 0; x < activeCols; x++) {
      segments.push({ d: `M ${x} 0 L ${x + 1} 0` });
    }
    // Internal walls
    for (let y = 0; y < activeRows; y++) {
      for (let x = 0; x < activeCols; x++) {
        const cell = maze[y]?.[x];
        if (!cell) continue;
        if (cell.walls.right) {
          segments.push({ d: `M ${x + 1} ${y} L ${x + 1} ${y + 1}` });
        }
        if (cell.walls.bottom) {
          segments.push({ d: `M ${x} ${y + 1} L ${x + 1} ${y + 1}` });
        }
      }
    }

    const defaultPaths: string[] = [];
    const accentPaths: Record<string, string[]> = {};

    // Initialize groupings for all accent colors
    accentPalette.forEach((color) => {
      accentPaths[color] = [];
    });

    const random = createSeededRandom(seed + 100);

    segments.forEach((seg) => {
      if (accentProbability > 0 && random() < accentProbability && accentPalette.length > 0) {
        const color = accentPalette[Math.floor(random() * accentPalette.length)];
        accentPaths[color].push(seg.d);
      } else {
        defaultPaths.push(seg.d);
      }
    });

    return {
      defaultPath: defaultPaths.join(' '),
      accents: Object.entries(accentPaths).map(([color, paths]) => ({
        color,
        path: paths.join(' '),
      })),
    };
  }, [activeCols, activeRows, seed, accentProbability, JSON.stringify(accentPalette)]);

  const backgroundStyle = useMemo(() => {
    if (!gradientEnabled) {
      return {
        background: bgColor,
      };
    }
    const startStr = `${gradientStart} ${gradientStartStop}%`;
    const midStr = useThreeColors ? `, ${gradientMiddle} ${gradientMiddleStop}%` : '';
    const endStr = `, ${gradientEnd} ${gradientEndStop}%`;

    if (gradientType === 'radial') {
      return {
        background: `radial-gradient(circle at ${radialCenterX}% ${radialCenterY}%, ${startStr}${midStr}${endStr})`,
      };
    }
    return {
      background: `linear-gradient(${gradientAngle}deg, ${startStr}${midStr}${endStr})`,
    };
  }, [
    gradientEnabled,
    bgColor,
    gradientStart,
    gradientEnd,
    gradientMiddle,
    useThreeColors,
    gradientStartStop,
    gradientMiddleStop,
    gradientEndStop,
    gradientAngle,
    gradientType,
    radialCenterX,
    radialCenterY
  ]);

  if (!mazePaths) return null;

  // Let's compute a neat layout scale so the SVG fits centered or spreads across the screen
  const scaleX = windowSize.w / cols;
  const scaleY = windowSize.h / rows;
  const currentCellSize = Math.max(scaleX, scaleY);
  
  const actualWidth = activeCols * currentCellSize;
  const actualHeight = activeRows * currentCellSize;
  
  // Center alignment offset
  const leftOffset = (windowSize.w - actualWidth) / 2;
  const topOffset = (windowSize.h - actualHeight) / 2;

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden"
      style={{
        ...backgroundStyle,
        perspective: `${perspective}px`,
        perspectiveOrigin: 'center center',
      }}
    >
      <AnimatePresence>
        <motion.div
          key={`${cols}-${rows}-${seed}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale3D / 100})`,
          }}
        >
          <svg 
            className="absolute"
            style={{ 
              left: leftOffset, 
              top: topOffset,
              width: actualWidth,
              height: actualHeight,
            }}
            viewBox={`0 0 ${activeCols} ${activeRows}`}
            preserveAspectRatio="none"
          >
            <defs>
              {showGlow && (
                <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation={glowIntensity * glowSpread} result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              )}
            </defs>

            {/* Default Walls */}
            {mazePaths.defaultPath && (
              <path 
                d={mazePaths.defaultPath} 
                stroke={wallColor} 
                strokeWidth={lineWidth} 
                fill="none" 
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Glowing Accent Walls */}
            {mazePaths.accents.map(({ color, path }, i) => {
              if (!path) return null;
              return (
                <path 
                  key={`${color}-${i}`}
                  d={path} 
                  stroke={color} 
                  strokeWidth={lineWidth + 0.5} 
                  fill="none" 
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={showGlow ? "url(#neon-glow)" : undefined}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
