import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Pause, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ScrollParallax } from '../motion/ParallelScroll';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../utils/youtube';

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

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement | null>(null);
  const [activeUploadedVideo, setActiveUploadedVideo] = useState('');
  const [isVideoPaused, setIsVideoPaused] = useState(false);
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
  const embedSrc: string | undefined = youtubeId
    ? getYouTubeEmbedUrl(configuredVideo, { autoplay: true, mute: true, loop: true, controls: false, rel: false }) ?? undefined
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`
      : '';
  const configuredPoster = cmsHero?.defaultImageUrl || '';
  const [resolvedHeroMedia, setResolvedHeroMedia] = React.useState({ video: '', image: '', poster: '' });
  const uploadedVideo = useCmsVideo && !isCmsVideoEmbed ? resolvedHeroMedia.video : '';
  const isUploadedVideoActive = Boolean(uploadedVideo && activeUploadedVideo === uploadedVideo);
  const heroVideo = isUploadedVideoActive ? uploadedVideo : HERO_VIDEO;

  useEffect(() => {
    setActiveUploadedVideo('');
  }, [uploadedVideo]);

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

  const heroPoster = resolvedHeroMedia.poster || (useCmsImage ? resolvedHeroMedia.image || HERO_POSTER : HERO_POSTER);

  useEffect(() => {
    if (useCmsImage || isCmsVideoEmbed) return;
    const video = isUploadedVideoActive ? uploadedVideoRef.current : videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    let isHeroVisible = false;
    const savePlaybackPosition = () => {
      if (Number.isFinite(video.currentTime)) savedHeroVideoTime = video.currentTime;
    };
    const restorePlaybackPosition = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.currentTime = savedHeroVideoTime % video.duration;
    };
    video.addEventListener('timeupdate', savePlaybackPosition);
    video.addEventListener('loadedmetadata', restorePlaybackPosition);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) restorePlaybackPosition();
    const syncPlayback = () => {
      if (reducedMotion || isVideoPaused || !isHeroVisible || document.visibilityState === 'hidden') {
        savePlaybackPosition();
        video.pause();
        return;
      }
      video.muted = true;
      void video.play().catch((error: unknown) => {
        console.warn('[HomeHero] Muted autoplay was blocked:', error);
      });
    };
    const onVisibilityChange = () => syncPlayback();
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          isHeroVisible = entry.isIntersecting;
          syncPlayback();
        }, { threshold: 0.05 });
    if (observer) {
      observer.observe(hero);
    } else {
      isHeroVisible = true;
      syncPlayback();
    }

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      video.removeEventListener('timeupdate', savePlaybackPosition);
      video.removeEventListener('loadedmetadata', restorePlaybackPosition);
      savePlaybackPosition();
      video.pause();
    };
  }, [heroVideo, isCmsVideoEmbed, isUploadedVideoActive, isVideoPaused, reducedMotion, useCmsImage]);

  const activateUploadedVideo = () => {
    if (reducedMotion) return;
    const candidate = uploadedVideoRef.current;
    const fallback = videoRef.current;
    if (!candidate || !fallback || !uploadedVideo || activeUploadedVideo === uploadedVideo) return;

    const fallbackTime = Number.isFinite(fallback.currentTime) ? fallback.currentTime : savedHeroVideoTime;
    if (Number.isFinite(candidate.duration) && candidate.duration > 0) {
      candidate.currentTime = fallbackTime % candidate.duration;
    }
    savedHeroVideoTime = fallbackTime;
    candidate.muted = true;
    candidate.volume = fallback.volume;
    candidate.play().then(
      () => setActiveUploadedVideo(uploadedVideo),
      (error: unknown) => {
        console.warn('[HomeHero] Uploaded hero video could not start; keeping the default video:', error);
      }
    );
  };

  const exploreDivisions = () => {
    const divisionsSection = document.getElementById('divisions');
    if (!divisionsSection) {
      onNavigate('/divisions');
      return;
    }

    divisionsSection.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      ref={heroRef}
      className="home-video-hero relative isolate w-full overflow-hidden"
    >
      <div className="home-video-hero__panel relative isolate flex min-h-[680px] w-full items-center overflow-hidden bg-[#12172A] text-white sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]">
        <ScrollParallax targetRef={heroRef} distance={24} className="home-video-hero__media absolute -inset-y-10 right-[-2%] w-[72%] overflow-hidden">
          {useCmsImage ? (
            <img
              src={resolvedHeroMedia.image || HERO_POSTER}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : reducedMotion ? (
            <img
              src={heroPoster}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
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
            <>
              <video
                ref={videoRef}
                src={HERO_VIDEO}
                poster={HERO_POSTER}
                autoPlay={!reducedMotion && !isVideoPaused}
                loop
                playsInline
                disableRemotePlayback
                muted
                preload="metadata"
                aria-hidden="true"
                disablePictureInPicture
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 brightness-[1.04] contrast-[1.12] saturate-[1.08] ${
                  isUploadedVideoActive ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {uploadedVideo && (
                <video
                  key={uploadedVideo}
                  ref={uploadedVideoRef}
                  src={uploadedVideo}
                  poster={heroPoster}
                  loop
                  playsInline
                  disableRemotePlayback
                  muted
                  preload="metadata"
                  aria-hidden="true"
                  disablePictureInPicture
                  onCanPlay={activateUploadedVideo}
                  onError={() => {
                    console.warn('[HomeHero] Uploaded hero video could not be loaded; keeping the default video.');
                  }}
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 brightness-[1.04] contrast-[1.12] saturate-[1.08] ${
                    isUploadedVideoActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </>
          )}
        </ScrollParallax>
        <div className="home-video-hero__tint absolute inset-0" aria-hidden="true" />
        {!useCmsImage && !isCmsVideoEmbed && !reducedMotion && (
          <button
            type="button"
            className="home-video-control absolute right-6 top-6 z-30"
            onClick={() => setIsVideoPaused((paused) => !paused)}
            aria-label={isVideoPaused ? 'Play header video' : 'Pause header video'}
          >
            {isVideoPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
        )}
        <motion.div
          className="home-video-hero__content relative z-20 w-full max-w-[620px] px-[clamp(28px,5vw,64px)] py-24"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="home-hero-eyebrow">Events <span>·</span> Studio <span>·</span> IT <span>·</span> Travels <span>·</span> Mart</p>
          <h1>
            <span>Creating moments.</span>
            <span><em>Capturing</em> memories.</span>
          </h1>
          <div className="home-hero-actions">
            <button type="button" className="home-button home-button--primary" onClick={() => onNavigate('/services')}>
              Plan your event <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </motion.div>
        <button
          type="button"
          onClick={exploreDivisions}
          className="home-scroll-button absolute bottom-7 left-1/2 z-20 -translate-x-1/2"
          aria-label="Scroll to discover Mahdev"
        >
          <ArrowDown aria-hidden="true" />
        </button>
        <button
          type="button"
          className="home-latest-card absolute bottom-8 right-8 z-20"
          onClick={() => onNavigate('/portfolio')}
        >
          <span><small>Explore</small><strong>Recent work</strong></span>
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
