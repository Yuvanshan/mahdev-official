import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ScrollParallax } from '../motion/ParallelScroll';
import { AnimatedHeroTitle } from '../common/AnimatedHeroTitle';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../utils/youtube';

// Sky-300 → blue-200 → white, matching the previous clipped-text gradient.
const HERO_TITLE_GRADIENT = ['#7dd3fc', '#bfdbfe', '#ffffff'];

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const HERO_VIDEO = '/assets/hero_landing.mp4';
// First frame shown instantly (preloaded in index.html) until the video can play.
const HERO_POSTER = '/assets/hero_landing_poster.jpg';
const DEFAULT_CMS_HERO_VIDEO = '/assets/hero_main.mp4?v=2';
let savedHeroVideoTime = 0;

function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|))(\d+)/);
  return match?.[1] || null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onExploreServices,
}) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { homepageConfig } = useFirestoreDataContext();
  const cmsHero = homepageConfig?.hero;
  const configuredVideo = cmsHero?.videoUrl || cmsHero?.mediaUrl || '';
  const useCmsVideo = Boolean(configuredVideo && configuredVideo !== DEFAULT_CMS_HERO_VIDEO && cmsHero?.mediaType !== 'image');
  const configuredImage = cmsHero?.imageUrl || cmsHero?.mediaUrl || '';
  const useCmsImage = Boolean(configuredImage && cmsHero?.mediaType === 'image');
  const youtubeId = useCmsVideo ? extractYouTubeId(configuredVideo) : null;
  const vimeoId = useCmsVideo ? extractVimeoId(configuredVideo) : null;
  const isCmsVideoEmbed = Boolean(youtubeId || vimeoId);
  const embedSrc = youtubeId
    ? getYouTubeEmbedUrl(configuredVideo, { autoplay: true, mute: true, loop: true, controls: false, rel: false })
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`
      : '';
  const configuredPoster = cmsHero?.defaultImageUrl || '';
  const [resolvedHeroMedia, setResolvedHeroMedia] = React.useState({ video: '', image: '', poster: '' });

  useEffect(() => {
    let active = true;
    const resolve = async (url: string) => {
      if (!url) return '';
      return resolveMediaUrl(url);
    };
    Promise.all([
      resolve(useCmsVideo ? configuredVideo : ''),
      resolve(useCmsImage ? configuredImage : ''),
      resolve(configuredPoster),
    ])
      .then(([video, image, poster]) => {
        if (active) setResolvedHeroMedia({ video, image, poster });
      })
      .catch((error: unknown) => {
        console.error('[HomeHero] Configured media could not be resolved:', error);
        if (active) setResolvedHeroMedia({ video: '', image: '', poster: '' });
      });
    return () => { active = false; };
  }, [configuredImage, configuredPoster, configuredVideo, useCmsImage, useCmsVideo]);

  const heroVideo = useCmsVideo ? resolvedHeroMedia.video || HERO_VIDEO : HERO_VIDEO;
  const heroPoster = resolvedHeroMedia.poster || (useCmsImage ? resolvedHeroMedia.image || HERO_POSTER : HERO_POSTER);

  useEffect(() => {
    if (useCmsImage || isCmsVideoEmbed) return;
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    let audioEnabled = false;
    let userInteracted = false;
    let hasAttemptedAudibleAutoplay = false;
    let isHeroVisible = false;
    let playbackRequest = 0;
    const savePlaybackPosition = () => {
      if (Number.isFinite(video.currentTime)) savedHeroVideoTime = video.currentTime;
    };
    const restorePlaybackPosition = () => {
      if (
        savedHeroVideoTime > 0 &&
        Number.isFinite(video.duration) &&
        savedHeroVideoTime < video.duration
      ) {
        video.currentTime = savedHeroVideoTime;
      }
    };

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };

    const pauseVideo = () => {
      playbackRequest += 1;
      savePlaybackPosition();
      video.pause();
      video.muted = true;
    };

    const startVideo = async (tryAudio: boolean) => {
      if (!isHeroVisible || document.visibilityState === 'hidden') return;

      const requestId = ++playbackRequest;
      video.volume = 0.2;
      video.muted = !tryAudio;
      try {
        await video.play();
        if (requestId !== playbackRequest || !isHeroVisible) {
          return;
        }
        if (tryAudio) {
          audioEnabled = true;
          removeInteractionListeners();
        }
      } catch (error) {
        if (requestId !== playbackRequest) return;
        video.muted = true;
        if (tryAudio && isHeroVisible) {
          try {
            await video.play();
          } catch (mutedError) {
            console.warn('[HomeHero] Muted autoplay was blocked:', mutedError);
          }
          if (requestId !== playbackRequest || !isHeroVisible) return;
          if (userInteracted) {
            console.warn('[HomeHero] Could not enable video audio after interaction:', error);
          }
          return;
        }
        console.warn('[HomeHero] Could not start the hero video:', error);
      }
    };

    const enableAudio = () => {
      userInteracted = true;
      if (audioEnabled || !isHeroVisible) return;
      void startVideo(true);
    };

    window.addEventListener('pointerdown', enableAudio, { passive: true });
    window.addEventListener('touchstart', enableAudio, { passive: true });
    window.addEventListener('keydown', enableAudio);
    video.addEventListener('timeupdate', savePlaybackPosition);
    video.addEventListener('loadedmetadata', restorePlaybackPosition);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) restorePlaybackPosition();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseVideo();
      } else if (isHeroVisible) {
        void startVideo(audioEnabled || userInteracted || !hasAttemptedAudibleAutoplay);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          isHeroVisible = entry.isIntersecting;
          if (!isHeroVisible) {
            pauseVideo();
            return;
          }
          const tryAudio = audioEnabled || userInteracted || !hasAttemptedAudibleAutoplay;
          if (!userInteracted && !audioEnabled) hasAttemptedAudibleAutoplay = true;
          void startVideo(tryAudio);
        }, { threshold: 0.05 });
    if (observer) {
      observer.observe(hero);
    } else {
      isHeroVisible = true;
      hasAttemptedAudibleAutoplay = true;
      void startVideo(true);
    }

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeInteractionListeners();
      video.removeEventListener('timeupdate', savePlaybackPosition);
      video.removeEventListener('loadedmetadata', restorePlaybackPosition);
      pauseVideo();
    };
  }, [heroVideo, isCmsVideoEmbed, useCmsImage]);

  const explore = () => {
    if (onExploreServices) onExploreServices();
    else if (onExploreMahdev) onExploreMahdev();
    else onNavigate('/divisions');
  };

  return (
    <section
      ref={heroRef}
      className="relative isolate min-h-[680px] overflow-hidden bg-slate-950 sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]"
    >
      <ScrollParallax targetRef={heroRef} distance={34} className="absolute -inset-y-10 inset-x-0 overflow-hidden">
        {useCmsImage ? (
          <img
            src={resolvedHeroMedia.image || HERO_POSTER}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.04] contrast-[1.12] saturate-[1.08]"
          />
        ) : isCmsVideoEmbed ? (
          <iframe
            src={embedSrc}
            title="MAHDEV homepage showcase"
            aria-hidden="true"
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute inset-0 h-full w-full scale-125 border-0 object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={heroVideo}
            poster={heroPoster}
            autoPlay
            loop
            playsInline
            disableRemotePlayback
            muted
            preload="metadata"
            aria-hidden="true"
            disablePictureInPicture
            className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.04] contrast-[1.12] saturate-[1.08]"
          />
        )}
      </ScrollParallax>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/30 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-[100px]"
      />
      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))] lg:px-10">
        <motion.div
          className="max-w-3xl"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 aria-label="Creating moments. Capturing memories. Delivering innovation." className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            <span className="block"><AnimatedHeroTitle text="Creating moments." /></span>
            <span className="block">
              <AnimatedHeroTitle text="Capturing memories." delay={0.18} gradient={HERO_TITLE_GRADIENT} />
            </span>
            <span className="block"><AnimatedHeroTitle text="Delivering innovation." delay={0.36} /></span>
          </h1>
          <button
            type="button"
            onClick={explore}
            className="group mt-9 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Explore services
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
