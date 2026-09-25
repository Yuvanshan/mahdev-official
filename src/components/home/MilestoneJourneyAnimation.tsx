import React, { useState, useEffect, useRef } from 'react';
import { FirestoreMilestone } from '../../types/firestore';

export type TransportMode =
  | 'walk'
  | 'bicycle'
  | 'motorbike'
  | 'car'
  | 'boat'
  | 'airplane'
  | 'jet'
  | 'spacecraft';

export const TRANSPORT_MODES: TransportMode[] = [
  'walk',       // 2021 Founding Vision / Inception
  'bicycle',    // 2022 SWS Event Management
  'motorbike',  // 2023 U1 Studio Cinema & Media
  'car',        // 2024 Islandwide Reach & 500+ Projects
  'boat',       // 2025 IT & Solutions Division
  'airplane',   // 2026 Mahdev Pvt Ltd Incorporation
  'jet',        // 2026+ Mahdev Travels & Smart Mart
  'spacecraft', // 2027+ Global Horizons & Scaled AI
];

export function getTransportModeLabel(mode: TransportMode): string {
  switch (mode) {
    case 'walk':
      return 'Executive Stride (Founding Vision)';
    case 'bicycle':
      return 'Aero-Cycle (Creative Velocity)';
    case 'motorbike':
      return 'Cafe-Racer Expedition (Media & Film)';
    case 'car':
      return 'Executive Roadster (Islandwide Reach)';
    case 'boat':
      return 'Marine Yacht (IT & Solutions)';
    case 'airplane':
      return 'Aviation Jet (Corporate Incorporation)';
    case 'jet':
      return 'Supersonic Flight (Travels & Mart)';
    case 'spacecraft':
      return 'Orbital Cruiser (Global Horizons)';
    default:
      return 'Corporate Progression';
  }
}

interface Milestone3DOverlayProps {
  milestones: FirestoreMilestone[];
  activeIndex: number;
  onSelectMilestone?: (milestone: FirestoreMilestone, index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 3D Parallel Parallax Overlay that floats directly OVER the 6 or 8 milestone cards.
 * Features:
 * - Dynamic 3D positioning that tracks the upper center of each card in real time
 * - Neon laser guide trajectory path connecting the cards with smooth looping curve
 * - Handsome, professional 3D young executive man walking with volumetric shading and realistic posture
 * - When in car, airplane, jet, boat, or spacecraft: sleek tinted aero-cockpit with NO PERSON visible inside
 * - 3D Parallel parallax depth layering (translateZ elevation, spotlight beam projected onto active card)
 */
export const Milestone3DOverlay: React.FC<Milestone3DOverlayProps> = ({
  milestones,
  activeIndex,
  onSelectMilestone,
  isPlaying,
  onTogglePlay,
  progress,
  setProgress,
  cardRefs,
  containerRef,
}) => {
  const [characterPos, setCharacterPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cardCenters, setCardCenters] = useState<{ x: number; y: number }[]>([]);

  const totalPoints = Math.max(milestones.length, 2);

  // Recalculate card coordinates relative to the container
  const updateCardCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const centers: { x: number; y: number }[] = [];

    cardRefs.current.forEach((ref) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        centers.push({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + 34, // Hover right above top third of card
        });
      }
    });

    if (centers.length > 0) {
      setCardCenters(centers);
    }
  };

  useEffect(() => {
    updateCardCoordinates();
    window.addEventListener('resize', updateCardCoordinates);
    const timer = setTimeout(updateCardCoordinates, 150);
    return () => {
      window.removeEventListener('resize', updateCardCoordinates);
      clearTimeout(timer);
    };
  }, [milestones.length]);

  // Compute interpolated (x, y) along the milestone cards path with smooth row transitions
  useEffect(() => {
    if (cardCenters.length === 0) return;
    const count = cardCenters.length;
    if (count === 1) {
      setCharacterPos(cardCenters[0]);
      return;
    }

    const scaledProgress = progress * (count - 1);
    const index = Math.floor(scaledProgress);
    const t = scaledProgress - index;

    const p0 = cardCenters[Math.min(index, count - 1)];
    const p1 = cardCenters[Math.min(index + 1, count - 1)];

    if (p0 && p1) {
      // If moving from one row to the next row (large Y difference & negative X delta),
      // create a smooth curved transition instead of a diagonal straight line cut
      const isRowTransition = p1.y - p0.y > 50 && p1.x < p0.x;
      if (isRowTransition) {
        // Parametric bezier arc sweeping around the right side of the cards
        const midX = Math.max(p0.x, p1.x) + 45;
        const midY = (p0.y + p1.y) / 2;
        const u = 1 - t;
        const x = u * u * p0.x + 2 * u * t * midX + t * t * p1.x;
        const y = u * u * p0.y + 2 * u * t * midY + t * t * p1.y;
        setCharacterPos({ x, y });
      } else {
        // Smooth linear interpolation along current row
        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;
        setCharacterPos({ x, y });
      }
    }
  }, [progress, cardCenters]);

  const currentSegment = Math.min(
    Math.floor(progress * (totalPoints - 1)),
    TRANSPORT_MODES.length - 1
  );
  const activeMode: TransportMode = TRANSPORT_MODES[currentSegment] || 'walk';

  const prevXRef = useRef<number>(0);
  const [bankAngle, setBankAngle] = useState<number>(0);

  useEffect(() => {
    if (characterPos.x > 0) {
      const dx = characterPos.x - prevXRef.current;
      prevXRef.current = characterPos.x;
      if (Math.abs(dx) > 0.05) {
        const bank = Math.max(-10, Math.min(10, dx * 0.9));
        setBankAngle(bank);
      }
    }
  }, [characterPos.x]);

  const bobY = isPlaying ? Math.sin(progress * Math.PI * 24) * 3 : 0;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 overflow-visible"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(55px)',
      }}
    >
      {/* Dynamic Laser Guide Trajectory Ribbon connecting all cards */}
      {cardCenters.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ transform: 'translateZ(20px)' }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0052FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <style>{`
              @keyframes laserPathFlow {
                to { stroke-dashoffset: -36; }
              }
              @keyframes beaconPulse {
                0% { r: 6; opacity: 0.9; }
                100% { r: 16; opacity: 0; }
              }
            `}</style>
          </defs>

          {/* Wide Ambient Glow Ribbon behind the laser */}
          <path
            d={generateSmoothPath(cardCenters)}
            fill="none"
            stroke="#0052FF"
            strokeWidth="7"
            strokeOpacity="0.25"
            filter="url(#neonGlow)"
          />

          {/* Smooth path between card nodes with flowing dashed energy stream */}
          <path
            d={generateSmoothPath(cardCenters)}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3"
            strokeDasharray="9 6"
            style={{ animation: 'laserPathFlow 1.6s linear infinite' }}
          />

          {/* Waypoint circles over each milestone card */}
          {cardCenters.map((pt, i) => {
            const isVisited = i <= activeIndex;
            const isCurrent = i === activeIndex;
            return (
              <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                {isCurrent && (
                  <circle
                    r="8"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                    style={{ animation: 'beaconPulse 1.4s ease-out infinite' }}
                  />
                )}
                <circle
                  r="7"
                  fill={isVisited ? '#0052FF' : '#ffffff'}
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  filter="url(#neonGlow)"
                />
                <circle
                  r="3"
                  fill="#ffffff"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Floating 3D Handsome Executive Man Character with Parallel Parallax Elevation & Dynamic Banking */}
      {characterPos.x > 0 && (
        <div
          className="absolute transition-transform duration-100 ease-out pointer-events-none"
          style={{
            left: `${characterPos.x}px`,
            top: `${characterPos.y}px`,
            transform: `translate(-50%, -85%) translate3d(0, ${bobY}px, 80px) rotateZ(${bankAngle}deg) rotateY(${bankAngle * 0.7}deg)`,
            willChange: 'left, top, transform',
          }}
        >
          {/* Downward 3D Spotlight Beam projected onto the card surface below */}
          <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-28 h-12 bg-gradient-to-b from-blue-500/30 via-cyan-400/15 to-transparent rounded-full blur-md pointer-events-none transform -rotate-12" />

          {/* Parallax Depth Ambient Shadow */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-20 h-4 bg-slate-950/40 rounded-full blur-[3px] transform scale-x-110" />

          {/* Handsome Professional Character Figure in 3/4 Isometric 3D Perspective */}
          <div className="relative transform hover:scale-105 transition-transform duration-200 filter drop-shadow-[0_14px_28px_rgba(0,82,255,0.45)]">
            <HandsomeBoyWithTransport mode={activeMode} />
          </div>

          {/* Floating High-Tech HUD Tooltip indicating Milestone Trajectory & Mode */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950/95 border border-blue-400/50 text-[10px] font-mono font-bold text-blue-300 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white">{milestones[activeIndex]?.year || 'Trajectory'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-300 text-[9px] font-sans font-semibold uppercase tracking-wider">
              {activeMode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Builds smooth bezier spline coordinates across card waypoint nodes with natural multi-row routing
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    // If wrapping to a new row below
    if (p1.y - p0.y > 50 && p1.x < p0.x) {
      const sweepX = Math.max(p0.x, p1.x) + 40;
      const midY = (p0.y + p1.y) / 2;
      path += ` C ${sweepX} ${p0.y}, ${sweepX} ${p1.y}, ${p1.x} ${p1.y}`;
    } else {
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      path += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
    }
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

/**
 * Handsome Professional Boy Character & 3D Isometric Transports:
 * - Handsome, sharp, professional young executive man in 3D isometric perspective:
 *   - Sculpted jawline, neat styled espresso/dark textured hair with volumetric specular shine
 *   - Confident handsome expression, natural eyes with catchlight (NO pink clown cheeks, NO cartoon spectacles)
 *   - Tailored bespoke navy/charcoal corporate suit, crisp white shirt collar, silk royal-blue tie
 *   - Oxford leather dress shoes, natural articulated 3D walking stride with isometric shadow
 * - Inside Car, Airplane, Jet, Spacecraft, Boat:
 *   - STRICTLY NO PERSON VISIBLE INSIDE!
 *   - Deep-tinted executive privacy windshield / cockpit with specular metallic glare
 */
export const HandsomeBoyWithTransport: React.FC<{ mode: TransportMode }> = ({ mode }) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center select-none">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-24 h-24 overflow-visible"
      >
        <defs>
          {/* Executive Suit Shading Gradients */}
          <linearGradient id="suitBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="suitHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#1e3a8a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
          </linearGradient>

          {/* Modern Youthful Hair Gradients (Deep Obsidian Jet-Black with Warm Golden-Caramel Sheen, NO GREY) */}
          <linearGradient id="youthfulHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="30%" stopColor="#18181b" />
            <stop offset="70%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          <linearGradient id="hairHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="40%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>

          {/* Cylindrical 3D Limb Gradient for Real Volumetric Depth */}
          <linearGradient id="limbCylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Handsome Youthful Skin Tones (Fresh, Smooth, Glowing) */}
          <linearGradient id="youngSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="55%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fba74e" />
          </linearGradient>

          {/* Soft Youthful Jaw Shadow (Smooth Contour, Zero Wrinkles) */}
          <linearGradient id="youngJawShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.6" />
          </linearGradient>

          {/* Holographic Tablet Beam Gradient */}
          <linearGradient id="hologramRaysGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0052ff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
          </linearGradient>

          {/* Deep-Tinted Executive Privacy Windshield (STRICTLY NO PERSON VISIBLE INSIDE!) */}
          <linearGradient id="executiveWindshield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#0284c7" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#03254c" stopOpacity="1" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>

          {/* Metallic Vehicle Body Gradient */}
          <linearGradient id="metallicBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="30%" stopColor="#0f172a" />
            <stop offset="70%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0052FF" stopOpacity="0.5" />
          </linearGradient>

          {/* 3D Drop Shadow Filter */}
          <filter id="volumetricShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#0052ff" floodOpacity="0.35" />
          </filter>

          <style>{`
            @keyframes walkStrideBack {
              0%, 100% { transform: rotate(14deg); }
              50% { transform: rotate(-14deg); }
            }
            @keyframes walkStrideFront {
              0%, 100% { transform: rotate(-14deg); }
              50% { transform: rotate(14deg); }
            }
            @keyframes armSwingRight {
              0%, 100% { transform: rotate(-12deg); }
              50% { transform: rotate(14deg); }
            }
            @keyframes armSwingLeft {
              0%, 100% { transform: rotate(14deg); }
              50% { transform: rotate(-12deg); }
            }
            @keyframes wheelSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes thrusterGlow {
              0%, 100% { opacity: 0.75; transform: scaleX(0.85); }
              50% { opacity: 1; transform: scaleX(1.25); }
            }
            @keyframes neonUnderglow {
              0%, 100% { opacity: 0.35; transform: scaleX(0.95); }
              50% { opacity: 0.75; transform: scaleX(1.1); }
            }
          `}</style>
        </defs>

        {mode === 'walk' && <Boy3DWalkFigure />}
        {mode === 'bicycle' && <BoyBicycleFigure />}
        {mode === 'motorbike' && <BoyMotorbikeFigure />}
        {mode === 'car' && <BoyCarFigure />}
        {mode === 'boat' && <BoyBoatFigure />}
        {mode === 'airplane' && <BoyAirplaneFigure />}
        {mode === 'jet' && <BoyJetFigure />}
        {mode === 'spacecraft' && <BoySpacecraftFigure />}
      </svg>
    </div>
  );
};

/**
 * Handsome 3D Young Executive Head in 3/4 Isometric Perspective:
 * - Fresh, modern youthful haircut: stylish textured pompadour/quiff high-fade
 *   (deep obsidian black with warm amber/espresso crest highlights, clean barbershop razor fade)
 * - Defined youthful jawline, healthy glowing skin, sharp confident brows
 * - Expressive almond eyes with double specular catchlight sparkle
 * - Charming confident young entrepreneur smile
 * - Tailored white collar and royal-blue silk tie with gold tie bar
 * - ABSOLUTELY NO grey hair streaks, NO receding hairline, NO wrinkles, NO clown cheeks!
 */
/**
 * Modern Handsome 3D Young Executive Head in 3/4 Isometric Perspective:
 * - Fresh, modern youthful haircut: stylish textured crop / layered modern quiff with crisp high-fade
 *   (deep obsidian black with rich espresso top sheen, razor-sharp clean barbershop fade, NO comb-over, NO grey)
 * - Sleek modern wireless tech earbud in ear (modern youthful executive touch)
 * - Defined youthful jawline, healthy radiant glowing skin, confident athletic brows
 * - Expressive almond eyes with dual specular catchlights
 * - Charming confident young leader smile
 * - Tailored crisp white collar and royal-blue silk tie with gold tie clip
 */
export const HandsomeBoyHead: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* 1. Crisp Barbershop High Skin Fade (Rear & Sides) */}
      <path
        d="M -7 -13 C -8 -17 -6 -21 -2 -23 C 3 -25 9 -25 14 -22 C 17 -20 18 -15 17 -11 C 15 -11 12 -13 7 -14 C 2 -15 -3 -13 -5 -10 Z"
        fill="url(#youthfulHairGrad)"
        stroke="#09090b"
        strokeWidth="1.1"
      />

      {/* 2. Sculpted Youthful Face & Defined Chiseled Jawline */}
      <path
        d="M -4 -13 C -4 -18 1 -20 7 -20 C 14 -20 18 -16 18 -10 C 18 -4 13 2 8 3 C 2 3 -4 -5 -4 -13 Z"
        fill="url(#youngSkinGrad)"
        stroke="#0f172a"
        strokeWidth="1.1"
      />

      {/* Smooth Ambient Jawline Shadow (Youthful, Chiseled, Zero Wrinkles) */}
      <path
        d="M 2 -2 Q 7 3.5 12 -0.5 Q 16 -5 18 -9"
        stroke="url(#youngJawShadow)"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />

      {/* 3. Modern Textured Young Entrepreneur Haircut (Trendy Layered Crop / Modern Fringe) */}
      {/* Main Volume Body */}
      <path
        d="M -6 -18 C -6 -25 3 -29 13 -26 C 18 -24 20 -20 19 -16 C 16 -17 12 -18 7 -17 C 1 -16 -3 -12 -5 -11 Z"
        fill="url(#youthfulHairGrad)"
        stroke="#09090b"
        strokeWidth="1.2"
      />

      {/* Forward Textured Strands / Stylish Modern Fringe Over Forehead */}
      <path
        d="M -2 -25 C 4 -28 11 -27 15 -23 C 12 -22 8 -22 3 -21 C 0 -21 -1 -23 -2 -25 Z"
        fill="url(#hairHighlightGrad)"
        opacity="0.95"
      />
      <path
        d="M 2 -27 C 7 -29 13 -26 16 -22 C 13 -21 9 -21 5 -20 C 3 -21 2 -24 2 -27 Z"
        fill="#27272a"
      />

      {/* Sharp Dynamic Modern Texture Strands */}
      <path d="M 0 -23 Q 5 -26 10 -23" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 3 -25 Q 9 -27 14 -22" stroke="#d97706" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
      <path d="M -1 -19 Q 4 -22 9 -18" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />

      {/* Modern Barbershop Razor-Sharp Temple Fade & Sideburn */}
      <path d="M -4 -12 L -3 -7 L -1 -8 L -2 -13 Z" fill="#18181b" />

      {/* Sleek Wireless Tech Earbud (Modern Young Executive Accessory) */}
      <ellipse cx="-2.5" cy="-8" rx="1.6" ry="2.2" fill="#ffffff" stroke="#38bdf8" strokeWidth="0.8" />
      <circle cx="-2.5" cy="-8" r="0.7" fill="#0052FF" />

      {/* 4. Handsome Youthful Facial Features */}
      {/* Groomed Athletic Left Eyebrow */}
      <path d="M 1 -14 Q 5 -17 8 -15" stroke="#09090b" strokeWidth="1.3" strokeLinecap="round" />
      {/* Right Eyebrow in 3/4 Perspective */}
      <path d="M 10 -15 Q 14 -18 16 -15" stroke="#09090b" strokeWidth="1.3" strokeLinecap="round" />

      {/* Left Eye: Almond Shape with Deep Obsidian Pupil, Royal Blue Inner Iris, Dual Catchlights */}
      <ellipse cx="5" cy="-11" rx="1.8" ry="1.4" fill="#09090b" />
      <circle cx="5" cy="-11" r="1.1" fill="#1d4ed8" />
      <circle cx="5" cy="-11" r="0.7" fill="#020617" />
      <circle cx="4.5" cy="-11.5" r="0.55" fill="#ffffff" />
      <circle cx="5.5" cy="-10.7" r="0.25" fill="#ffffff" opacity="0.8" />

      {/* Right Eye (3/4 angle) with Dual Catchlights */}
      <ellipse cx="13" cy="-11.2" rx="1.8" ry="1.4" fill="#09090b" />
      <circle cx="13" cy="-11.2" r="1.1" fill="#1d4ed8" />
      <circle cx="13" cy="-11.2" r="0.7" fill="#020617" />
      <circle cx="12.5" cy="-11.7" r="0.55" fill="#ffffff" />
      <circle cx="13.5" cy="-10.9" r="0.25" fill="#ffffff" opacity="0.8" />

      {/* Sculpted Youthful Nose Bridge with Subtle Specular Highlight */}
      <path d="M 9 -11 L 9.6 -6.5 L 8 -6" stroke="#d97706" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="9.2" cy="-8.5" r="0.4" fill="#ffffff" opacity="0.7" />

      {/* Confident, Charming Young Executive Smile */}
      <path
        d="M 5 -3.5 Q 8.5 -1.8 12 -3.8"
        stroke="#0f172a"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 11.5 -3.8 Q 12.8 -4.5 12.2 -3.2" stroke="#ea580c" strokeWidth="0.8" strokeLinecap="round" />

      {/* 5. Modern Tailored Executive Collar & Electric Royal-Blue Silk Tie */}
      {/* Crisp White Shirt Collar Points */}
      <polygon points="3,-1.5 8,4 12,-1.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.9" />
      <polygon points="5,-1.5 8,2.5 10,-1.5" fill="#f8fafc" />
      {/* Silk Royal-Blue Tie Knot & Body with 3D Bevel */}
      <polygon points="8,2 6.8,8 8,11.5 9.2,8" fill="#0052FF" stroke="#1d4ed8" strokeWidth="0.8" />
      <polygon points="8,2 8,11.5 9.2,8" fill="#1d4ed8" opacity="0.6" />
      {/* Polished Gold Tie Bar */}
      <line x1="7.2" y1="5.5" x2="8.8" y2="5.5" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
};

/* 1. Walk Mode: 3D Isometric Handsome Young Executive Man Walking Confidently */
const Boy3DWalkFigure: React.FC = () => (
  <g transform="translate(4, 2)" filter="url(#volumetricShadow)">
    {/* 3D Glowing Ground Beacon Target Pedestal */}
    <ellipse cx="48" cy="80" rx="20" ry="5.5" fill="#0052FF" opacity="0.2" />
    <ellipse cx="48" cy="80" rx="14" ry="3.8" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" opacity="0.75" />
    <ellipse cx="48" cy="80" rx="18" ry="4.5" fill="#020617" opacity="0.6" />

    {/* Trailing Back Leg in Cylindrical Tailored Charcoal Trousers (Natural Stride) */}
    <g style={{ transformOrigin: '49px 53px', animation: 'walkStrideBack 0.9s ease-in-out infinite' }}>
      <path
        d="M 49 53 L 57 65 L 65 76 L 72 76"
        stroke="url(#limbCylinderGrad)"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Back Leg Crease Highlight */}
      <path
        d="M 50 54 L 57 64 L 64 74"
        stroke="#475569"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Back Oxford Luxury Dress Shoe */}
      <path d="M 64 76 L 75 76 L 73 79.5 L 62 79.5 Z" fill="#020617" stroke="#0052FF" strokeWidth="1" />
      <circle cx="71" cy="77" r="0.65" fill="#ffffff" opacity="0.8" />
    </g>

    {/* 3D Handsome Executive Head with Modern Youthful Hairstyle */}
    <HandsomeBoyHead x={45} y={30} />

    {/* Tailored Bespoke Navy/Charcoal Suit Jacket with 3D Facets & Volumetric Shading */}
    {/* Torso Depth Side Plane */}
    <path
      d="M 37 34 L 34 52 L 38 54 L 40 33 Z"
      fill="#020617"
    />
    {/* Main Jacket Torso */}
    <path
      d="M 39 33 L 37 54 L 54 54 L 52 33 Z"
      fill="url(#suitBodyGrad)"
      stroke="#020617"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* 3D Highlight Shoulder Plane */}
    <path d="M 38 33 L 44 33 L 42 43 L 38 38 Z" fill="url(#suitHighlightGrad)" opacity="0.7" />
    
    {/* Left Satin Lapel with Cyan Rim Light */}
    <path d="M 42 33 L 45 47 L 49 33" fill="#1e293b" stroke="#38BDF8" strokeWidth="1.2" />
    {/* Right Breast Pocket with Silk White Handkerchief */}
    <line x1="47.5" y1="38" x2="51.5" y2="38" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
    <polygon points="49,38 50.5,35.5 51.5,38" fill="#ffffff" />
    {/* Polished Chrome Jacket Button */}
    <circle cx="45" cy="48" r="0.9" fill="#f8fafc" stroke="#64748b" strokeWidth="0.4" />

    {/* Forward Striding Front Leg in Cylindrical Tailored Trousers (Natural Stride) */}
    <g style={{ transformOrigin: '42px 53px', animation: 'walkStrideFront 0.9s ease-in-out infinite' }}>
      <path
        d="M 42 53 L 35 66 L 29 78 L 36 78"
        stroke="url(#limbCylinderGrad)"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Front Trouser Pressed Crease with Bright Rim Light */}
      <path
        d="M 41 54 L 35 66 L 30 77"
        stroke="#64748b"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Front Polished Oxford Dress Shoe with Specular Highlights */}
      <path d="M 28 78 L 39 78 L 37 81.5 L 26 81.5 Z" fill="#020617" stroke="#38BDF8" strokeWidth="1.1" />
      <circle cx="35" cy="79" r="0.8" fill="#ffffff" opacity="0.85" />
      <line x1="29" y1="78.5" x2="33" y2="78.5" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
    </g>

    {/* Right Trailing Arm with Cylindrical Volumetric Shading */}
    <g style={{ transformOrigin: '50px 36px', animation: 'armSwingRight 0.9s ease-in-out infinite' }}>
      <path d="M 50 36 L 59 47 L 57 55" stroke="url(#limbCylinderGrad)" strokeWidth="3.4" strokeLinecap="round" />
    </g>

    {/* Left Forward Arm Carrying 3D Holographic Executive Tablet */}
    <g style={{ transformOrigin: '40px 36px', animation: 'armSwingLeft 0.9s ease-in-out infinite' }}>
      <path d="M 40 36 L 31 48 L 30 56" stroke="url(#limbCylinderGrad)" strokeWidth="3.4" strokeLinecap="round" />
    </g>
    
    {/* 3D Holographic Glass Tablet */}
    <g transform="translate(1, -2)">
      {/* Translucent Holographic Emitter Rays */}
      <polygon points="26,56 16,42 34,42 38,56" fill="url(#hologramRaysGrad)" opacity="0.35" />
      {/* Holographic Floating Data Node */}
      <circle cx="25" cy="42" r="2.2" fill="#38BDF8" opacity="0.9" />
      <circle cx="25" cy="42" r="3.5" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="2 1" fill="none" opacity="0.8" />
      {/* Glass Tablet Device */}
      <rect
        x="22"
        y="54"
        width="16"
        height="11"
        rx="2.2"
        fill="#020617"
        stroke="#0052FF"
        strokeWidth="1.5"
      />
      {/* Specular Glass Bevel Reflection */}
      <line x1="24" y1="55" x2="36" y2="55" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="35" cy="61.5" r="1.1" fill="#38BDF8" />
    </g>
  </g>
);

/* 2. Bicycle Mode: Handsome Executive in 3D Isometric Frame */
const BoyBicycleFigure: React.FC = () => (
  <g transform="translate(6, 2)" filter="url(#volumetricShadow)">
    <ellipse cx="22" cy="62" rx="10" ry="9" stroke="#0f172a" strokeWidth="2.6" fill="none" />
    <circle cx="22" cy="62" r="3.5" fill="#38BDF8" />
    <ellipse cx="66" cy="62" rx="10" ry="9" stroke="#0f172a" strokeWidth="2.6" fill="none" />
    <circle cx="66" cy="62" r="3.5" fill="#38BDF8" />

    {/* Lightweight Alloy Frame */}
    <path
      d="M 22 62 L 40 62 L 53 49 L 36 49 Z M 40 62 L 48 42 M 53 49 L 66 62"
      stroke="#0052FF"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <line x1="48" y1="42" x2="58" y2="42" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />

    {/* Handsome Rider */}
    <HandsomeBoyHead x={46} y={28} />

    {/* Tailored Riding Torso */}
    <path d="M 45 35 L 42 48 L 49 48 Z" fill="url(#suitBodyGrad)" stroke="#0f172a" strokeWidth="1.8" />
    <path d="M 45 38 L 56 42" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 42 48 L 37 57 L 40 62" stroke="#0f172a" strokeWidth="2.8" strokeLinejoin="round" />
  </g>
);

/* 3. Motorbike Mode: Handsome Executive on 3D Cafe-Racer */
const BoyMotorbikeFigure: React.FC = () => (
  <g transform="translate(5, 2)" filter="url(#volumetricShadow)">
    <circle cx="20" cy="62" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
    <circle cx="20" cy="62" r="4" fill="#38BDF8" />
    <circle cx="68" cy="62" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
    <circle cx="68" cy="62" r="4" fill="#38BDF8" />

    {/* Exhaust & Chassis */}
    <path d="M 36 61 L 58 61 L 72 59" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    <path
      d="M 24 59 L 36 49 L 58 49 L 66 55 L 62 62 L 26 62 Z"
      fill="#0f172a"
      stroke="#0052FF"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M 40 49 L 52 49 L 56 53 L 38 53 Z" fill="#0052FF" />

    {/* Twin Headlamps */}
    <polygon points="69,54 82,49 82,61 69,57" fill="#38BDF8" opacity="0.65" />

    {/* Handsome Rider */}
    <HandsomeBoyHead x={45} y={28} />
    <path d="M 44 35 L 39 47 L 51 47 Z" fill="url(#suitBodyGrad)" stroke="#0f172a" strokeWidth="1.8" />
    <path d="M 45 38 L 60 51" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M 40 47 L 45 56 L 49 60" stroke="#0f172a" strokeWidth="2.8" strokeLinejoin="round" />
  </g>
);

/* 4. Car Mode: 3D Isometric Luxury Executive Roadster
   CRITICAL REQUIREMENT: STRICTLY NO PERSON VISIBLE INSIDE!
   Features deep-tinted obsidian privacy windshield with specular light reflections.
*/
const BoyCarFigure: React.FC = () => (
  <g transform="translate(3, 4)" filter="url(#volumetricShadow)">
    {/* Ground Ambient Contact 3D Shadow & Electric Neon Underglow */}
    <ellipse cx="48" cy="68" rx="38" ry="4.5" fill="#020617" opacity="0.6" />
    <ellipse
      cx="48"
      cy="68"
      rx="34"
      ry="5.5"
      fill="#0052FF"
      style={{ animation: 'neonUnderglow 1.2s ease-in-out infinite' }}
    />

    {/* Sleek Aerodynamic Roadster Body in 3D Isometric View */}
    <path
      d="M 8 60 L 13 49 L 26 47 L 38 37 L 62 37 L 74 47 L 86 50 L 88 60 Z"
      fill="url(#metallicBodyGrad)"
      stroke="#020617"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />

    {/* 3D Isometric Roof & Side Profile */}
    <path
      d="M 38 37 L 62 37 L 74 47 L 26 47 Z"
      fill="#1e293b"
      stroke="#0052FF"
      strokeWidth="1.4"
    />

    {/* Royal Blue Chrome Streak & Side Vent */}
    <path d="M 14 53 L 84 53" stroke="#38BDF8" strokeWidth="1.8" />
    <polygon points="30,49 35,49 33,52 28,52" fill="#0052FF" />

    {/* PRIVATE DEEP-TINTED EXECUTIVE WINDSHIELD (STRICTLY NO PERSON VISIBLE INSIDE!) */}
    <path
      d="M 40 38 L 60 38 L 71 46 L 34 46 Z"
      fill="url(#executiveWindshield)"
      stroke="#38bdf8"
      strokeWidth="1.5"
    />
    {/* Specular Light Reflection Glare Streak across windshield glass */}
    <line x1="44" y1="39" x2="63" y2="44" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
    <line x1="50" y1="39" x2="67" y2="44" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

    {/* Rear Wheel with Rotating 3D Alloy Rims and Blue Caliper */}
    <g style={{ transformOrigin: '23px 61px', animation: 'wheelSpin 0.5s linear infinite' }}>
      <circle cx="23" cy="61" r="9" fill="#020617" stroke="#64748b" strokeWidth="2.2" />
      <line x1="15" y1="61" x2="31" y2="61" stroke="#38BDF8" strokeWidth="1.4" />
      <line x1="23" y1="53" x2="23" y2="69" stroke="#38BDF8" strokeWidth="1.4" />
      <circle cx="23" cy="61" r="3.5" fill="#0052FF" />
    </g>

    {/* Front Wheel with Rotating 3D Alloy Rims and Blue Caliper */}
    <g style={{ transformOrigin: '72px 61px', animation: 'wheelSpin 0.5s linear infinite' }}>
      <circle cx="72" cy="61" r="9" fill="#020617" stroke="#64748b" strokeWidth="2.2" />
      <line x1="64" y1="61" x2="80" y2="61" stroke="#38BDF8" strokeWidth="1.4" />
      <line x1="72" y1="53" x2="72" y2="69" stroke="#38BDF8" strokeWidth="1.4" />
      <circle cx="72" cy="61" r="3.5" fill="#0052FF" />
    </g>

    {/* LED Laser Headlamp Projection Beam */}
    <polygon points="88,52 108,44 108,62 88,56" fill="#38BDF8" opacity="0.65" />
    <circle cx="87" cy="54" r="2.4" fill="#38BDF8" />
  </g>
);

/* 5. Boat Mode: 3D High-Speed Marine Yacht
   CRITICAL REQUIREMENT: STRICTLY NO PERSON VISIBLE INSIDE!
*/
const BoyBoatFigure: React.FC = () => (
  <g transform="translate(3, 4)" filter="url(#volumetricShadow)">
    {/* Hydrodynamic Water Ripples */}
    <path
      d="M 4 69 Q 18 64 32 69 T 58 69 T 84 69 T 96 69"
      stroke="#38bdf8"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 12 72 Q 26 68 40 72 T 66 72 T 90 72"
      stroke="#0284c7"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
    />

    {/* Sharp Yacht Hull */}
    <path
      d="M 12 59 L 18 51 L 62 51 L 78 58 L 72 66 L 16 66 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path d="M 19 59 L 76 59" stroke="#0052FF" strokeWidth="2.4" />

    {/* Tinted Cabin Windshield (NO PERSON VISIBLE INSIDE!) */}
    <path d="M 35 51 L 43 43 L 57 43 L 62 51 Z" fill="url(#executiveWindshield)" stroke="#0f172a" strokeWidth="1.6" />
    <path d="M 47 45 L 58 48" stroke="#ffffff" strokeWidth="1.4" opacity="0.8" />
  </g>
);

/* 6. Airplane Mode: 3D Executive Aviation Jet
   CRITICAL REQUIREMENT: STRICTLY NO PERSON VISIBLE INSIDE!
*/
const BoyAirplaneFigure: React.FC = () => (
  <g transform="translate(3, 0)" filter="url(#volumetricShadow)">
    {/* Vapor Trail */}
    <path
      d="M 2 52 C 8 50 12 54 18 52"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />

    {/* Aircraft Aerodynamic Fuselage in 3D Isometric View */}
    <path
      d="M 14 50 L 22 44 L 70 44 C 77 44 82 46 86 50 C 82 53 77 55 70 55 L 22 55 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    {/* Royal Blue Corporate Livery Streak */}
    <path d="M 22 50 L 76 50" stroke="#0052FF" strokeWidth="2.4" strokeLinecap="round" />

    {/* Swept Wings with Blue Winglets */}
    <polygon points="40,46 52,24 60,24 50,46" fill="#0052FF" stroke="#0f172a" strokeWidth="1.6" />
    <polygon points="40,53 52,66 58,66 48,53" fill="#1d4ed8" stroke="#0f172a" strokeWidth="1.6" />
    <polygon points="14,50 21,34 26,34 23,50" fill="#0052FF" stroke="#0f172a" strokeWidth="1.6" />

    {/* Deep-Tinted Cockpit Canopy with Specular Glint (NO PERSON VISIBLE INSIDE!) */}
    <path
      d="M 66 45 C 73 45 80 47 83 50 C 80 52 73 53 66 53 Z"
      fill="url(#executiveWindshield)"
      stroke="#38bdf8"
      strokeWidth="1.4"
    />
    <line x1="70" y1="47" x2="79" y2="49" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
  </g>
);

/* 7. Jet Mode: Supersonic Delta Jet with Plasma Thrust Plumes
   CRITICAL REQUIREMENT: STRICTLY NO PERSON VISIBLE INSIDE!
*/
const BoyJetFigure: React.FC = () => (
  <g transform="translate(3, -1)" filter="url(#volumetricShadow)">
    {/* Supersonic Dual Plasma Plumes with High-Energy Pulsation */}
    <g style={{ transformOrigin: '10px 50px', animation: 'thrusterGlow 0.35s ease-in-out infinite alternate' }}>
      <polygon points="10,50 -5,43 4,50 -5,57" fill="#0052FF" opacity="0.9" />
      <polygon points="10,50 0,46 6,50 0,54" fill="#38BDF8" />
    </g>

    {/* Stealth Delta Jet Fuselage in 3/4 Isometric Perspective */}
    <path
      d="M 12 50 L 24 42 L 74 47 L 88 50 L 74 53 L 24 58 Z"
      fill="#0f172a"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* 3D Top Wing Delta Foil */}
    <polygon points="28,45 44,22 52,22 49,46" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.4" />

    {/* Aerodynamic Tinted Cockpit Canopy (NO PERSON VISIBLE INSIDE!) */}
    <ellipse cx="62" cy="49" rx="10" ry="3.5" fill="url(#executiveWindshield)" stroke="#38bdf8" strokeWidth="1.4" />
    <line x1="56" y1="48" x2="68" y2="49" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
  </g>
);

/* 8. Spacecraft Mode: Horizon Orbital Quantum Cruiser
   CRITICAL REQUIREMENT: STRICTLY NO PERSON VISIBLE INSIDE!
*/
const BoySpacecraftFigure: React.FC = () => (
  <g transform="translate(3, -2)" filter="url(#volumetricShadow)">
    {/* Quantum Propulsion Rings with Plasma Pulsation */}
    <g style={{ transformOrigin: '14px 50px', animation: 'thrusterGlow 0.4s ease-in-out infinite alternate' }}>
      <ellipse cx="14" cy="50" rx="4" ry="10" stroke="#38BDF8" strokeWidth="1.6" fill="none" opacity="0.85" />
      <polygon points="10,50 -4,45 4,50 -4,55" fill="#38BDF8" />
    </g>

    {/* Futuristic Cruiser Hull */}
    <path
      d="M 16 50 L 30 41 L 78 48 L 90 50 L 78 52 L 30 59 Z"
      fill="#020617"
      stroke="#38BDF8"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Quantum Fin */}
    <polygon points="36,45 50,21 58,21 52,46" fill="#0052FF" stroke="#38BDF8" strokeWidth="1.5" />

    {/* Shielded Panoramic Canopy with Specular Glare (NO PERSON VISIBLE INSIDE!) */}
    <ellipse cx="66" cy="49.5" rx="11" ry="3.8" fill="url(#executiveWindshield)" stroke="#38bdf8" strokeWidth="1.4" />
    <line x1="59" y1="48" x2="73" y2="50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
  </g>
);
