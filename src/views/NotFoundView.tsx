import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Compass,
  ArrowRight,
  Search,
  Sparkles,
  Building2,
  ShoppingBag,
  Calendar,
  Layers,
  Phone,
  Mail,
  HelpCircle,
  RotateCcw,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { DisplayHeading, H3, BodyLarge, Body } from '../components/ui/Heading';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';
import { DIVISION_LIST } from '../config/divisions';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getMailtoLink, getTelLink } from '../config/company';

export interface NotFoundViewProps {
  onNavigate: (path: string) => void;
  resourceType?: 'page' | 'product' | 'service' | 'division' | 'order';
  attemptedSlug?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onNavigate,
  resourceType = 'page',
  attemptedSlug,
}) => {
  const { companySettings, products, services } = useFirestoreDataContext();
  const [searchQuery, setSearchQuery] = useState('');

  const companyName = companySettings.name || 'Mahdev Pvt Ltd';
  const hotline = companySettings.primaryPhone || '075 092 8078';
  const email = companySettings.email || 'info@mahdev.lk';

  // Handle Quick Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Determine Title & Subtitle based on resourceType
  let badgeText = 'ERROR 404 — ROUTE NOT FOUND';
  let headingText = 'Page not found.';
  let messageText =
    "The page you're looking for doesn't exist or may have moved to a new destination in the Mahdev network.";

  if (resourceType === 'product') {
    badgeText = 'PRODUCT NOT FOUND';
    headingText = 'Product Not Found';
    messageText = attemptedSlug
      ? `We couldn't locate a product matching "${attemptedSlug}" in our corporate catalog. It may have been archived, discontinued, or the URL has changed.`
      : 'The product you requested does not exist in our catalog or may currently be offline.';
  } else if (resourceType === 'service') {
    badgeText = 'SERVICE NOT FOUND';
    headingText = 'Service Not Found';
    messageText = attemptedSlug
      ? `We couldn't find a service package matching "${attemptedSlug}". Please explore our active division services below.`
      : 'The requested service package or division solution could not be located in our active directory.';
  } else if (resourceType === 'division') {
    badgeText = 'DIVISION NOT FOUND';
    headingText = 'Division Not Found';
    messageText = attemptedSlug
      ? `The division "${attemptedSlug}" is not a recognized operating unit of ${companyName}.`
      : 'The requested business division could not be identified.';
  }

  return (
    <div
      id="not-found-view"
      className="relative w-full min-h-[85vh] flex flex-col justify-center py-12 sm:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 overflow-hidden selection:bg-[#0052FF] selection:text-white"
    >
      <SEOHead
        title={`404 — ${headingText} | ${companyName}`}
        description="The requested page or resource could not be located within the Mahdev Pvt Ltd corporate network."
        noIndex={true}
      />

      {/* Atmospheric Background Lighting & Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/6 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Subtle Geometric Wireframe Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"
      />

      <SectionContainer size="md" className="relative z-10 text-center">
        {/* Animated 3D Floating Geometry & 404 Hero Emblem */}
        <div className="relative flex items-center justify-center mb-6 sm:mb-8 select-none">
          {/* Subtle Outer Glow Ring with Perpetual Rotation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-dashed border-blue-500/20 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-blue-600/10 pointer-events-none"
          />

          {/* Floating 3D Geometric Badge */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                y: [-6, 6, -6],
                rotateX: [0, 8, 0],
                rotateY: [0, -8, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative z-10 flex items-center justify-center"
            >
              {/* Layered Floating 404 Display Typography */}
              <div className="relative">
                <span className="font-display font-black text-7xl sm:text-9xl tracking-tighter bg-gradient-to-br from-slate-950 via-[#0052FF] to-blue-800 bg-clip-text text-transparent drop-shadow-xs">
                  404
                </span>
                {/* Subtle Electric Underline Glow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-transparent via-[#0052FF] to-transparent rounded-full blur-xs opacity-70" />
              </div>
            </motion.div>

            {/* Floating Orbiting Satellite Dots */}
            <motion.div
              animate={{
                x: [-15, 15, -15],
                y: [10, -10, 10],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-3 -right-6 px-2.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-[#0052FF] text-[10px] font-bold font-mono tracking-wider backdrop-blur-xs flex items-center gap-1.5 shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] animate-ping" />
              <span>UNRESOLVED</span>
            </motion.div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full bg-blue-50/80 border border-blue-200/80 text-[#0052FF] text-xs font-bold font-mono uppercase tracking-wider shadow-2xs"
        >
          <FileQuestion className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <DisplayHeading className="text-slate-950 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {headingText}
          </DisplayHeading>
        </motion.div>

        {/* Explanatory Message */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <BodyLarge className="text-slate-600 max-w-lg mx-auto mt-3.5 leading-relaxed text-sm sm:text-base">
            {messageText}
          </BodyLarge>
        </motion.div>

        {/* Direct Search / Route Finder Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-6 max-w-md mx-auto"
        >
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, services, or divisions..."
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0052FF] focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-7"
        >
          <Button
            variant="electric"
            size="lg"
            onClick={() => onNavigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
            className="shadow-sm hover:shadow-md transition-shadow font-bold text-xs sm:text-sm"
          >
            Back Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/#divisions')}
            leftIcon={<Layers className="w-4 h-4 text-[#0052FF]" />}
            className="font-bold text-xs sm:text-sm border-slate-300 hover:border-[#0052FF] bg-white"
          >
            Explore Divisions
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('/catalog')}
            leftIcon={<ShoppingBag className="w-4 h-4 text-slate-600" />}
            className="font-semibold text-xs sm:text-sm text-slate-700 hover:text-slate-950"
          >
            Browse Products
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('/book')}
            leftIcon={<Calendar className="w-4 h-4 text-slate-600" />}
            className="font-semibold text-xs sm:text-sm text-slate-700 hover:text-slate-950"
          >
            Book Services
          </Button>
        </motion.div>

        {/* Corporate Divisions Directory Quick Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 sm:mt-16 pt-10 border-t border-slate-200/80 max-w-2xl mx-auto text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Corporate Operating Divisions
            </H3>
            <span className="text-[11px] text-slate-400">Jump directly to a division</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIVISION_LIST.map((div) => (
              <button
                key={div.id}
                onClick={() => onNavigate(div.route)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF] hover:shadow-xs transition-all group text-left cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors truncate">
                    {div.name}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {div.tagline}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200 flex items-center justify-center text-slate-400 group-hover:text-[#0052FF] transition-colors shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Need Assistance Hotline & Email Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Need assistance finding a solution?</span>
          </span>

          <a
            href={getTelLink(hotline)}
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#0052FF] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{hotline}</span>
          </a>

          <a
            href={getMailtoLink(email, 'Assistance with missing page')}
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#0052FF] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{email}</span>
          </a>
        </motion.div>
      </SectionContainer>
    </div>
  );
};
