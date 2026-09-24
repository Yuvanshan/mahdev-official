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
      return 'Urban Stride (Founding Vision)';
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
 * - Dynamic 3D positioning that tracks the center top of each card in real time
 * - Neon laser guide trajectory path connecting the cards
 * - Handsome boy character in classic 3/4 isometric perspective angle
 * - 3D Parallel parallax depth layering (translateZ elevation, spotlight beam onto active card)
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
          y: rect.top - containerRect.top + 28, // Hover right above top edge of card
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

  // Compute interpolated (x, y) along the milestone cards path
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
      // Smooth linear/hermite interpolation across cards
      const x = p0.x + (p1.x - p0.x) * t;
      const y = p0.y + (p1.y - p0.y) * t;
      setCharacterPos({ x, y });
    }
  }, [progress, cardCenters]);

  const currentSegment = Math.min(
    Math.floor(progress * (totalPoints - 1)),
    TRANSPORT_MODES.length - 1
  );
  const activeMode: TransportMode = TRANSPORT_MODES[currentSegment] || 'walk';

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {/* 3D Connecting Neon Spline Pathway */}
      {cardCenters.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-85"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 82, 255, 0.45))' }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0052FF" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Smooth path between card nodes */}
          <path
            d={generateSmoothPath(cardCenters)}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-[pulse_3s_ease-in-out_infinite]"
          />

          {/* Waypoint circles over each milestone card */}
          {cardCenters.map((pt, i) => {
            const isVisited = i <= activeIndex;
            return (
              <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                <circle
                  r="6"
                  fill={isVisited ? '#0052FF' : '#ffffff'}
                  stroke="#38BDF8"
                  strokeWidth="2"
                  filter="url(#glow)"
                />
                <circle
                  r="2.5"
                  fill="#ffffff"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Floating 3D Handsome Boy Character with Parallel Parallax Elevation */}
      {characterPos.x > 0 && (
        <div
          className="absolute transition-transform duration-75 ease-out pointer-events-none"
          style={{
            left: `${characterPos.x}px`,
            top: `${characterPos.y}px`,
            transform: 'translate(-50%, -75%) translateZ(60px)',
            willChange: 'left, top, transform',
          }}
        >
          {/* Downward 3D Spotlight Beam projected onto the card beneath */}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-24 h-10 bg-gradient-to-b from-blue-500/25 via-cyan-400/10 to-transparent rounded-full blur-sm pointer-events-none transform -rotate-12" />

          {/* Subtle Parallax Shadow */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-3 bg-slate-900/30 rounded-full blur-[2px] transform scale-x-110" />

          {/* Handsome Boy Character Figure in 3/4 Isometric Perspective ("Old Angle") */}
          <div className="relative transform hover:scale-105 transition-transform duration-200 filter drop-shadow-[0_12px_20px_rgba(0,82,255,0.35)]">
            <HandsomeBoyWithTransport mode={activeMode} />
          </div>

          {/* Floating HUD Tooltip indicating Milestone Trajectory & Mode */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-blue-400/40 text-[10px] font-mono font-bold text-blue-300 shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{milestones[activeIndex]?.year || 'Trajectory'}</span>
            <span className="text-slate-400">•</span>
            <span className="text-white text-[9px] font-sans font-medium uppercase tracking-wider">
              {activeMode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Builds smooth bezier spline coordinates across card waypoint nodes
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    // Cubic bezier curve for dynamic 3D journey aesthetic
    path += ` Q ${p0.x} ${p0.y + 15}, ${mx} ${my} T ${p1.x} ${p1.y}`;
  }
  return path;
}

/**
 * Handsome Boy with Modern Styling:
 * - Youthful, charming facial features (sharp jawline, cheerful confident expression)
 * - Modern styled youth haircut with swept volume and stylish highlights (definitely not old man)
 * - Stylish spectacles / glasses in electric royal blue (#0052FF) with sleek frame
 * - Modern slim-fit navy blazer, crisp white collar, slim royal blue tie
 * - Transports rendered in classic 3/4 isometric perspective angle ("old angle")
 */
export const HandsomeBoyWithTransport: React.FC<{ mode: TransportMode }> = ({ mode }) => {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center select-none">
      <svg
        viewBox="0 0 90 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-20 h-20"
      >
        <defs>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="boyHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
          <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0052FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {mode === 'walk' && <BoyWalkFigure />}
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
 * Handsome Boy Head & Upper Torso with modern stylish hair, youth facial structure,
 * sharp specs and tailored blazer in 3/4 isometric perspective.
 */
export const HandsomeBoyHeadWithSpecs: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Voluminous stylish youthful hair (modern swept layered cut with texture) */}
      <path
        d="M -9 -14 C -9 -21 1 -24 9 -21 C 15 -19 18 -15 17 -11 C 14 -11 11 -14 5 -15 C -1 -16 -6 -13 -7 -10 C -8 -9 -9 -11 -9 -14 Z"
        fill="url(#boyHairGrad)"
        stroke="#0f172a"
        strokeWidth="1"
      />
      {/* Front stylish hair fringe / bangs sweeping over forehead */}
      <path
        d="M -4 -18 C 0 -22 6 -20 11 -17 C 8 -16 5 -13 2 -13 C -1 -13 -3 -15 -4 -18 Z"
        fill="#475569"
      />
      <path
        d="M 6 -19 C 10 -18 14 -14 13 -10 C 11 -11 8 -13 6 -14 Z"
        fill="#64748b"
        opacity="0.8"
      />

      {/* Youthful handsome head & jawline (clean, sharp, modern young angle) */}
      <path
        d="M -3 -13 C -3 -17 2 -18 7 -18 C 12 -18 15 -14 15 -10 C 15 -5 11 0 6 1 C 1 1 -3 -6 -3 -13 Z"
        fill="#fffbeb"
        stroke="#0f172a"
        strokeWidth="1.3"
      />
      {/* Subtle youth blush / contour */}
      <ellipse cx="4" cy="-7.5" rx="1.8" ry="1" fill="#fecdd3" opacity="0.6" />
      <ellipse cx="11" cy="-7.5" rx="1.8" ry="1" fill="#fecdd3" opacity="0.6" />

      {/* Stylish Modern Spectacles (Electric Blue #0052FF designer frame) */}
      {/* Left Eyeglass Frame */}
      <rect
        x="1.5"
        y="-13.5"
        width="4.6"
        height="4"
        rx="1.2"
        stroke="#0052FF"
        strokeWidth="1.4"
        fill="#ffffff"
        fillOpacity="0.85"
      />
      {/* Right Eyeglass Frame */}
      <rect
        x="7.8"
        y="-13.5"
        width="4.6"
        height="4"
        rx="1.2"
        stroke="#0052FF"
        strokeWidth="1.4"
        fill="#ffffff"
        fillOpacity="0.85"
      />
      {/* Glasses Bridge */}
      <line x1="6.1" y1="-11.5" x2="7.8" y2="-11.5" stroke="#0052FF" strokeWidth="1.4" />
      {/* Temple Arm connecting to ear */}
      <line x1="1.5" y1="-12" x2="-2" y2="-12.5" stroke="#0052FF" strokeWidth="1.2" strokeLinecap="round" />

      {/* Handsome expressive youthful eyes */}
      <circle cx="3.8" cy="-11.5" r="0.9" fill="#0f172a" />
      <circle cx="4.2" cy="-11.9" r="0.35" fill="#ffffff" /> {/* Eye glint highlight */}
      <circle cx="10.1" cy="-11.5" r="0.9" fill="#0f172a" />
      <circle cx="10.5" cy="-11.9" r="0.35" fill="#ffffff" /> {/* Eye glint highlight */}

      {/* Confident youthful smile */}
      <path
        d="M 4 -6 Q 6.5 -4.8 9.5 -6.2"
        stroke="#0f172a"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Modern Slim Shirt Collar & Blue Tie */}
      <polygon points="3,-4 6,1 9,-4" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
      <polygon points="6,-1 5,5 6,8 7,5" fill="#0052FF" stroke="#0052FF" strokeWidth="0.8" />
    </g>
  );
};

/* 1. Walk Mode: Handsome Boy in tailored youth suit with designer tech sling/briefcase */
const BoyWalkFigure: React.FC = () => (
  <g transform="translate(6, 4)">
    <HandsomeBoyHeadWithSpecs x={42} y={32} />

    {/* Modern Slim-Fit Blazer Torso */}
    <path
      d="M 39 32 L 37 48 L 48 48 L 46 32 Z"
      fill="url(#suitGrad)"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Azure lapel accent */}
    <path d="M 41 32 L 43 41 L 45 32" stroke="#38BDF8" strokeWidth="1" />

    {/* Dynamic youthful walking legs */}
    <path
      d="M 39 48 L 34 58 L 31 66 L 36 66"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 45 48 L 50 58 L 56 65 L 61 65"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Left arm holding slim modern designer leather bag */}
    <path d="M 39 35 L 32 45 L 30 50" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <rect
      x="25"
      y="50"
      width="11"
      height="8"
      rx="2"
      fill="#2563eb"
      stroke="#1d4ed8"
      strokeWidth="1.2"
    />
    <line x1="28" y1="50" x2="28" y2="48" stroke="#1d4ed8" strokeWidth="1.2" />
    <line x1="33" y1="50" x2="33" y2="48" stroke="#1d4ed8" strokeWidth="1.2" />
  </g>
);

/* 2. Bicycle Mode: Handsome Boy in 3D Isometric Aerodynamic Frame */
const BoyBicycleFigure: React.FC = () => (
  <g transform="translate(4, 2)">
    {/* Wheels with isometric tilt */}
    <ellipse cx="24" cy="58" rx="10" ry="9" stroke="#0f172a" strokeWidth="2" strokeDasharray="3 2" />
    <circle cx="24" cy="58" r="2.5" fill="#0052FF" />
    <ellipse cx="58" cy="58" rx="10" ry="9" stroke="#0f172a" strokeWidth="2" strokeDasharray="3 2" />
    <circle cx="58" cy="58" r="2.5" fill="#0052FF" />

    {/* Aero frame in electric blue */}
    <path
      d="M 24 58 L 39 58 L 50 44 L 33 44 Z"
      stroke="url(#blueGlow)"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path d="M 39 58 L 36 40" stroke="#0052FF" strokeWidth="2.2" />
    <path d="M 58 58 L 52 38 L 55 38" stroke="#0052FF" strokeWidth="2.2" />
    <ellipse cx="35" cy="39" rx="4.5" ry="1.5" fill="#0f172a" />

    {/* Handsome Boy Rider */}
    <HandsomeBoyHeadWithSpecs x={44} y={26} />
    <path
      d="M 41 27 L 37 41 L 45 41 L 47 28 Z"
      fill="url(#suitGrad)"
      stroke="#0f172a"
      strokeWidth="1.6"
    />
    <path d="M 46 30 L 51 39" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path d="M 39 41 L 43 49 L 40 58" stroke="#0f172a" strokeWidth="2.2" strokeLinejoin="round" />
  </g>
);

/* 3. Motorbike Mode: Handsome Boy on 3D Isometric Cafe-Racer */
const BoyMotorbikeFigure: React.FC = () => (
  <g transform="translate(4, 2)">
    {/* Wheels with alloy disc styling */}
    <ellipse cx="22" cy="58" rx="10.5" ry="9.5" stroke="#0f172a" strokeWidth="2.6" />
    <circle cx="22" cy="58" r="4.5" stroke="#38BDF8" strokeWidth="1.5" fill="#1e293b" />
    <ellipse cx="60" cy="58" rx="10.5" ry="9.5" stroke="#0f172a" strokeWidth="2.6" />
    <circle cx="60" cy="58" r="4.5" stroke="#38BDF8" strokeWidth="1.5" fill="#1e293b" />

    {/* Chassis & Body */}
    <path
      d="M 26 58 L 37 55 L 48 44 L 56 44 L 60 58"
      stroke="#0f172a"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    {/* Metallic Fuel Tank */}
    <path
      d="M 39 43 C 43 39 50 39 54 44 L 39 46 Z"
      fill="#2563eb"
      stroke="#1d4ed8"
      strokeWidth="1.6"
    />
    {/* Chrome Engine Block & Exhaust */}
    <rect x="35" y="48" width="11" height="7" rx="1.5" fill="#475569" stroke="#0f172a" strokeWidth="1" />
    <path d="M 41 53 L 20 56" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />

    {/* Projector LED Headlight Beam */}
    <polygon points="64,44 80,39 80,53 64,48" fill="#38bdf8" opacity="0.45" />
    <circle cx="64" cy="46" r="2.8" fill="#38BDF8" stroke="#0284c7" strokeWidth="1" />

    {/* Handsome Boy Rider */}
    <HandsomeBoyHeadWithSpecs x={42} y={26} />
    <path
      d="M 39 27 L 35 43 L 44 43 L 46 28 Z"
      fill="url(#suitGrad)"
      stroke="#0f172a"
      strokeWidth="1.6"
    />
    <path d="M 44 30 L 54 43" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 38 43 L 43 50 L 46 53" stroke="#0f172a" strokeWidth="2.4" strokeLinejoin="round" />
  </g>
);

/* 4. Car Mode: 3D Isometric Luxury Executive Roadster Convertible */
const BoyCarFigure: React.FC = () => (
  <g transform="translate(2, 2)">
    {/* Sleek Aerodynamic Roadster Body */}
    <path
      d="M 12 56 L 15 47 L 26 45 L 36 37 L 55 37 L 66 45 L 76 48 L 78 56 Z"
      fill="url(#suitGrad)"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Electric blue chrome accent streak */}
    <path d="M 16 51 L 76 51" stroke="#38BDF8" strokeWidth="1.4" />

    {/* Tinted Aerodynamic Windscreen */}
    <path d="M 53 38 L 62 45 L 48 45 Z" fill="#93c5fd" opacity="0.6" stroke="#60a5fa" strokeWidth="1" />

    {/* Wheels with alloy rims */}
    <circle cx="26" cy="57" r="8" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
    <circle cx="26" cy="57" r="2.8" fill="#38BDF8" />
    <circle cx="65" cy="57" r="8" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
    <circle cx="65" cy="57" r="2.8" fill="#38BDF8" />

    {/* Headlamp beam */}
    <polygon points="78,50 90,45 90,58 78,54" fill="#38BDF8" opacity="0.55" />
    <circle cx="77" cy="51" r="2" fill="#38BDF8" />

    {/* Handsome Boy Driving in 3/4 Isometric Perspective */}
    <HandsomeBoyHeadWithSpecs x={44} y={25} />
    <ellipse cx="53" cy="42" rx="3.2" ry="1.6" stroke="#94a3b8" strokeWidth="1.5" />
    <path d="M 45 32 L 52 41" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
  </g>
);

/* 5. Boat Mode: 3D High-Speed Luxury Marine Yacht cutting through waves */
const BoyBoatFigure: React.FC = () => (
  <g transform="translate(2, 2)">
    {/* Dynamic Translucent Water Ripples & Spray */}
    <path
      d="M 6 63 Q 18 58 30 63 T 52 63 T 74 63 T 84 63"
      stroke="#38bdf8"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 12 66 Q 24 62 36 66 T 58 66 T 80 66"
      stroke="#0284c7"
      strokeWidth="1.3"
      fill="none"
      strokeLinecap="round"
    />

    {/* Yacht Sharp Hydrodynamic Hull */}
    <path
      d="M 15 54 L 20 47 L 58 47 L 72 53 L 67 60 L 19 60 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M 21 54 L 70 54" stroke="#0052FF" strokeWidth="2.2" />

    {/* Cabin Windshield */}
    <path d="M 33 47 L 40 40 L 53 40 L 57 47 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
    <path d="M 48 41 L 55 46" stroke="#38bdf8" strokeWidth="2" />

    {/* Handsome Boy at the helm */}
    <HandsomeBoyHeadWithSpecs x={42} y={25} />
    <path d="M 44 32 L 50 41" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
  </g>
);

/* 6. Airplane Mode: 3D Executive Aviation Aircraft with Trailing Lines */
const BoyAirplaneFigure: React.FC = () => (
  <g transform="translate(2, -2)">
    {/* Vapor Trailing Line */}
    <path
      d="M 6 48 C 10 46 14 50 18 48"
      stroke="#38BDF8"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeDasharray="2 2"
    />

    {/* Aircraft Aerodynamic Fuselage */}
    <path
      d="M 14 46 L 20 42 L 64 42 C 70 42 74 44 76 46 C 74 48 70 50 64 50 L 20 50 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Swept Wings with Blue Tips */}
    <polygon points="36,44 47,25 54,25 45,44" fill="#0052FF" stroke="#0f172a" strokeWidth="1.5" />
    <polygon points="36,48 47,59 52,59 44,48" fill="#1d4ed8" stroke="#0f172a" strokeWidth="1.5" />
    <polygon points="14,46 20,33 24,33 22,46" fill="#0052FF" stroke="#0f172a" strokeWidth="1.5" />

    {/* Cockpit Canopy */}
    <path d="M 62 43 C 67 43 70 44 72 46 C 70 47 67 47 62 47 Z" fill="#38bdf8" opacity="0.85" />

    {/* Handsome Boy in Cockpit with Specs */}
    <HandsomeBoyHeadWithSpecs x={58} y={38} scale={0.7} />
  </g>
);

/* 7. Jet Mode: Supersonic Delta Jet with Plasma Thrust Plumes */
const BoyJetFigure: React.FC = () => (
  <g transform="translate(2, -3)">
    {/* Supersonic Dual Plasma Plumes */}
    <polygon points="10,46 2,43 6,46 2,49" fill="#0052FF" />
    <polygon points="10,46 5,44 7,46 5,48" fill="#38BDF8" />

    {/* Stealth Delta Jet Fuselage */}
    <path
      d="M 12 46 L 22 40 L 70 45 L 80 46 L 70 47 L 22 52 Z"
      fill="#0f172a"
      stroke="#38bdf8"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <polygon points="26,43 38,23 45,23 44,44" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />

    {/* Cockpit Canopy */}
    <ellipse cx="58" cy="45" rx="8" ry="2.8" fill="#38bdf8" opacity="0.8" />

    {/* Handsome Boy Pilot in 3/4 Isometric Perspective */}
    <HandsomeBoyHeadWithSpecs x={54} y={39} scale={0.65} />
  </g>
);

/* 8. Spacecraft Mode: 2027+ Horizon Orbital Quantum Cruiser */
const BoySpacecraftFigure: React.FC = () => (
  <g transform="translate(2, -4)">
    {/* Quantum Propulsion Rings */}
    <ellipse cx="14" cy="46" rx="4" ry="9" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.7" />
    <polygon points="10,46 2,44 5,46 2,48" fill="#38BDF8" />

    {/* Futuristic Cruiser Hull */}
    <path
      d="M 16 46 L 28 38 L 74 44 L 84 46 L 74 48 L 28 54 Z"
      fill="#090d16"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Quantum Fin */}
    <polygon points="34,42 46,20 54,20 48,43" fill="#0052FF" stroke="#38BDF8" strokeWidth="1.4" />

    {/* High-tech Panoramic Canopy */}
    <ellipse cx="62" cy="45.5" rx="9" ry="3.2" fill="#38BDF8" opacity="0.85" />

    {/* Handsome Boy Commander */}
    <HandsomeBoyHeadWithSpecs x={58} y={39} scale={0.65} />
  </g>
);
