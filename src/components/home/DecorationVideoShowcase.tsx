import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2 } from '../ui/Heading';
import { DecorationShowcaseVideo } from '../../types/cms';
import { useDeviceMotion } from '../motion/MotionWrappers';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

type DecorationVideo = DecorationShowcaseVideo;

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';

interface DecorationVideoShowcaseProps {
  onNavigate?: (route: string) => void;
}

export const DecorationVideoShowcase: React.FC<DecorationVideoShowcaseProps> = ({ onNavigate }) => {
  const { homepageConfig } = useFirestoreDataContext();
  const showcaseConfig = homepageConfig?.decorationShowcase;
  const videoList = useMemo<DecorationVideo[]>(() => {
    if (!Array.isArray(showcaseConfig?.videos)) return [];
    return showcaseConfig.videos.filter((video) => Boolean(video.videoUrl?.trim()));
  }, [showcaseConfig?.videos]);

  if (showcaseConfig?.enabled === false || videoList.length === 0) return null;

  return (
    <DecorationVideoShowcaseContent
      onNavigate={onNavigate}
      showcaseConfig={showcaseConfig}
      videoList={videoList}
    />
  );
};

const DecorationVideoShowcaseContent: React.FC<
  DecorationVideoShowcaseProps & {
    showcaseConfig: NonNullable<ReturnType<typeof useFirestoreDataContext>['homepageConfig']>['decorationShowcase'];
    videoList: DecorationVideo[];
  }
> = ({ onNavigate, showcaseConfig, videoList }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState('');
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yPlayer = useTransform(smoothProgress, [0, 1], ['-16px', '16px']);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(videoList.map((video) => video.category).filter(Boolean)));
    return ['All', ...unique];
  }, [videoList]);
  const filteredVideos = useMemo(
    () => selectedCategory === 'All' ? videoList : videoList.filter((video) => video.category === selectedCategory),
    [selectedCategory, videoList]
  );
  const playbackVideos = filteredVideos.length > 0 ? filteredVideos : videoList;
  const activeVideo = playbackVideos[activeVideoIndex] || playbackVideos[0];

  React.useEffect(() => {
    let active = true;
    if (!activeVideo?.videoUrl) {
      setResolvedVideoUrl('');
      return;
    }

    resolveMediaUrl(activeVideo.videoUrl)
      .then((url) => {
        if (active) setResolvedVideoUrl(url);
      })
      .catch((error) => {
        console.error(`[DecorationVideoShowcase] Could not resolve video ${activeVideo.id}:`, error);
        if (active) setResolvedVideoUrl('');
      });

    return () => {
      active = false;
    };
  }, [activeVideo?.id, activeVideo?.videoUrl]);

  React.useEffect(() => {
    let active = true;
    Promise.all(
      videoList.map(async (video) => {
        if (!video.thumbnailUrl) return [video.id, FALLBACK_THUMBNAIL] as const;
        try {
          return [video.id, await resolveMediaUrl(video.thumbnailUrl)] as const;
        } catch (error) {
          console.error(`[DecorationVideoShowcase] Could not resolve thumbnail ${video.id}:`, error);
          return [video.id, FALLBACK_THUMBNAIL] as const;
        }
      })
    ).then((entries) => {
      if (active) setResolvedThumbnails(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [videoList]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedVideoUrl) return;
    video.defaultMuted = true;
    video.muted = isMuted;
    video.playsInline = true;
    video.play().catch((error) => {
      console.debug('Showcase video autoplay deferred:', error);
    });
  }, [resolvedVideoUrl, isMuted]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-y border-slate-800 bg-slate-950 text-white">
      <SectionContainer
        id="decoration-videos"
        background="none"
        paddingY="xl"
        className="relative z-10"
      >
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{showcaseConfig?.badge || 'Real Event Productions'}</span>
            </div>
            <H2 className="text-white">{showcaseConfig?.title || 'Cinematic Event & Decoration Showcase'}</H2>
          </div>

          {categories.length > 1 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2" aria-label="Video categories">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setActiveVideoIndex(0);
                  }}
                  aria-pressed={selectedCategory === category}
                  className={`cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white shadow-lg shadow-blue-500/25'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div
          style={!reducedMotion && !isTouch ? { y: yPlayer } : undefined}
          className="mx-auto w-full max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
            <video
              ref={videoRef}
              key={activeVideo.videoUrl}
              src={resolvedVideoUrl || undefined}
              poster={resolvedThumbnails[activeVideo.id] || FALLBACK_THUMBNAIL}
              autoPlay
              loop={playbackVideos.length === 1}
              muted={isMuted}
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              aria-label="Event production showcase video"
              className="aspect-video h-full w-full object-cover"
              onEnded={() => setActiveVideoIndex((index) => (index + 1) % playbackVideos.length)}
            />
            <button
              type="button"
              onClick={() => setIsMuted((muted) => !muted)}
              aria-label={isMuted ? 'Turn video sound on' : 'Mute video'}
              title={isMuted ? 'Turn sound on' : 'Mute sound'}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur transition hover:bg-black/80"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

        <div className="mt-10 rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-950 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-300">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>Custom Stage Craft</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                Bring your event vision to life with bespoke stage design, floral installations, and lighting planned around your venue.
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-600/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600/40"
              >
                Request a consultation
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
