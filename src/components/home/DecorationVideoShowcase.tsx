import React, { useState, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  MapPin,
  ArrowRight,
  Layers,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { DecorationShowcaseVideo } from '../../types/cms';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

type DecorationVideo = DecorationShowcaseVideo;

interface DecorationVideoShowcaseProps {
  onNavigate?: (route: string) => void;
}

export const DecorationVideoShowcase: React.FC<DecorationVideoShowcaseProps> = (props) => {
  const { homepageConfig } = useFirestoreDataContext();
  const showcaseConfig = homepageConfig?.decorationShowcase;

  // Exclusively consume dynamic showcase videos from Homepage CMS Config
  const videoList = useMemo<DecorationVideo[]>(() => {
    if (showcaseConfig?.videos && Array.isArray(showcaseConfig.videos)) {
      return showcaseConfig.videos;
    }
    return [];
  }, [showcaseConfig?.videos]);

  if (showcaseConfig?.enabled === false || videoList.length === 0) {
    return null;
  }

  return (
    <DecorationVideoShowcaseContent
      {...props}
      showcaseConfig={showcaseConfig}
      videoList={videoList}
    />
  );
};

const DecorationVideoShowcaseContent: React.FC<
  DecorationVideoShowcaseProps & {
    showcaseConfig: any;
    videoList: DecorationVideo[];
  }
> = ({ onNavigate, showcaseConfig, videoList }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [modalVideo, setModalVideo] = useState<DecorationVideo | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yLeft = useTransform(smoothProgress, [0, 1], ['-20px', '20px']);
  const yRight = useTransform(smoothProgress, [0, 1], ['20px', '-20px']);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(videoList.map((v) => v.category).filter(Boolean)));
    return ['All', ...unique];
  }, [videoList]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') return videoList;
    return videoList.filter((v) => v.category === selectedCategory);
  }, [videoList, selectedCategory]);

  const activeVideo = filteredVideos[activeVideoIndex] || filteredVideos[0] || videoList[0];

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (showcaseConfig?.enabled === false || videoList.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-slate-950 text-white border-y border-slate-800">
      <ParallelWatermark text="07 // CINEMATIC" />
      <SectionContainer
        id="decoration-videos"
        background="none"
        paddingY="xl"
        className="relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showcaseConfig?.badge || 'Real Event Productions'}</span>
            </div>
            <H2 className="text-white">{showcaseConfig?.title || 'Cinematic Event & Decoration Showcase'}</H2>
            <Body className="text-slate-400 mt-2 max-w-2xl">
              {showcaseConfig?.subtitle || 'Experience the scale, floral artistry, and stage lighting behind Mahdev event productions.'}
            </Body>
          </div>

          {/* Category Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveVideoIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Showcase Layout (Featured Spotlight Player + Video Selector Grid) with Parallel Motion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Top: Featured Cinema Player */}
          <motion.div
            style={!reducedMotion && !isTouch ? { y: yLeft } : undefined}
            className="lg:col-span-8"
          >
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 blur-xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />

              {/* Video Element */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  key={activeVideo.videoUrl}
                  src={activeVideo.videoUrl}
                  poster={activeVideo.thumbnailUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Control Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90 transition-opacity flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
                  {/* Top Badge Info */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-md bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold tracking-wide uppercase">
                        {activeVideo.divisionName}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-slate-300 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {activeVideo.location}
                      </span>
                    </div>

                    <button
                      onClick={() => setModalVideo(activeVideo)}
                      className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                      title="Fullscreen Mode"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Video Metadata & Interactive Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-auto">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          {activeVideo.category}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-300">{activeVideo.venueType}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        {activeVideo.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-1 font-light">
                        {activeVideo.description}
                      </p>
                    </div>

                    {/* Player Quick Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleTogglePlay}
                        className="p-3 rounded-xl bg-white text-slate-950 hover:bg-slate-200 transition-transform active:scale-95 shadow-lg font-semibold cursor-pointer"
                        title={isPlaying ? 'Pause Reel' : 'Play Reel'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      <button
                        onClick={handleToggleMute}
                        className="p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('/book')}
                          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-blue-500/20 cursor-pointer hidden sm:flex items-center gap-1.5"
                        >
                          <span>Book Design</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right / Bottom: Video Selection Playlist with Parallel Motion */}
          <motion.div
            style={!reducedMotion && !isTouch ? { y: yRight } : undefined}
            className="lg:col-span-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Production Reels ({filteredVideos.length})</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Click to play</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
              {filteredVideos.map((video, index) => {
                const isSelected = activeVideo.id === video.id;
                return (
                  <div
                    key={video.id}
                    onClick={() => {
                      setActiveVideoIndex(index);
                      setIsPlaying(true);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3.5 items-center group ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                    }`}
                  >
                    {/* Thumbnail with mini play overlay */}
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                      <img
                        src={
                          video.thumbnailUrl && video.thumbnailUrl.trim() !== ''
                            ? video.thumbnailUrl.trim()
                            : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-900'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-200">
                        {video.duration}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                        {video.category}
                      </span>
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {video.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        {video.location}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick CTA Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-indigo-950/40 border border-blue-500/20 text-white mt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Need Custom Stagecraft?</span>
              </div>
              <p className="text-xs text-slate-300 font-light leading-relaxed mb-3">
                Consult with Mahdev's lead stage architect for 3D walkthroughs, floral rigging, and lighting plots.
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('/contact')}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Request Stage Consultation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Fullscreen Video Modal */}
        <AnimatePresence>
          {modalVideo && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md"
              onClick={() => setModalVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setModalVideo(null)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="aspect-video w-full bg-black">
                  <video
                    src={modalVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-6 bg-slate-900 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                        {modalVideo.divisionName} • {modalVideo.category}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1.5">{modalVideo.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {modalVideo.location} — {modalVideo.venueType}
                      </p>
                    </div>

                    {onNavigate && (
                      <button
                        onClick={() => {
                          setModalVideo(null);
                          onNavigate('/book');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-lg shadow-blue-500/20"
                      >
                        Book This Staging
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 mr-2">Production Highlights:</span>
                    {modalVideo.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </div>
  );
};
