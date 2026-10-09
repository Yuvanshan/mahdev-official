import React, { useState, useMemo } from 'react';
import {
  Camera,
  Star,
  Quote,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { TravelStory } from '../../data/travelsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { openWhatsAppInquiry, deriveLookupSku } from '../../utils/whatsapp';

export const TravelsGalleryStoriesSection: React.FC = () => {
  const { gallery: rawGallery, testimonials: rawTestimonials } = useFirestoreDataContext();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const galleryImages = useMemo(() => {
    if (rawGallery && rawGallery.length > 0) {
      const travelGal = rawGallery.filter(
        (g) => isSameDivision(g.division, 'travels') || isSameDivision((g as any).divisionId, 'travels')
      );
      if (travelGal.length > 0) {
        return travelGal.map((g) => ({
          src: (g as any).imageUrl || (g as any).url || '',
          title: g.title,
          location: (g as any).location || 'Sri Lanka',
        }));
      }
    }
    return [];
  }, [rawGallery]);

  const stories = useMemo<TravelStory[]>(() => {
    if (rawTestimonials && rawTestimonials.length > 0) {
      const travelStories = rawTestimonials.filter(
        (t) => isSameDivision(t.division, 'travels') || isSameDivision((t as any).divisionId, 'travels')
      );
      if (travelStories.length > 0) {
        return travelStories.map((t) => ({
          id: t.id,
          title: (t as any).title || (t as any).company || 'Unforgettable Journey',
          traveler: t.customerName || t.author || 'Verified Traveler',
          origin: (t as any).country || (t as any).location || t.company || 'Sri Lanka Guest',
          packageTaken: (t as any).packageTaken || (t as any).role || 'Bespoke Private Tour',
          quote: t.message || t.quote || '',
          rating: t.rating || 5,
          date: (t as any).date || '2025',
          image: t.imageUrl || t.avatarUrl || t.photoUrl || '',
        }));
      }
    }
    return [];
  }, [rawTestimonials]);

  if (galleryImages.length === 0 && stories.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="gallery" background="subtle" paddingY="xl" hasBorderBottom>
      {/* 1. CINEMATIC GALLERY */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Cinematic Visual Chronicles
          </Caption>
          <H2 className="text-slate-900">
            Capturing the Untamed Soul of Sri Lanka
          </H2>
          <Body className="text-slate-600 mt-2">
            A photographic tapestry of sacred monoliths, mist-blanketed tea estates, wild predator encounters, and sun-drenched coastlines.
          </Body>
        </ScrollReveal>
      </div>

      {/* Gallery Grid */}
      <div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {galleryImages.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setLightboxImage(img.src)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openWhatsAppInquiry({
                    title: img.title,
                    sku: `TRV-${deriveLookupSku(img.title, 'TRV')}`,
                    location: img.location,
                    divisionName: 'Mahdev Travels',
                    imageUrl: img.src,
                    type: 'gallery',
                  });
                }}
                title="Send inquiry with this photo to WhatsApp 0750928078"
                aria-label={`Ask about ${img.title} on WhatsApp`}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:scale-105 hover:bg-[#20bd5a]"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 p-4">
              <h4 className="line-clamp-2 font-display text-sm font-semibold text-slate-900">{img.title}</h4>
              <p className="text-xs text-slate-500">{img.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. TRAVEL STORIES & GUEST TESTIMONIALS */}
      {stories.length > 0 && (
        <>
          <div className="max-w-3xl mb-10">
            <ScrollReveal direction="up">
              <Caption className="text-[#0052FF] mb-2 block font-mono">
                Guest Chronicles
              </Caption>
              <H2 className="text-slate-900">
                Real Stories from Discerning Global Travelers
              </H2>
              <Body className="text-slate-600 mt-2">
                Read firsthand accounts of private expeditions planned and executed by Mahdev Travels.
              </Body>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(story.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <h4 className="font-display text-sm font-bold text-slate-900">
                    "{story.title}"
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    {story.quote}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{story.traveler}</div>
                    <div className="text-[11px] text-slate-500">{story.origin}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {story.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full-Screen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Enlarged gallery photo"
              className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  const activeImg = galleryImages.find((g) => g.src === lightboxImage);
                  const imgTitle = activeImg?.title || 'Travel Expedition Moment';
                  openWhatsAppInquiry({
                    title: imgTitle,
                    sku: `TRV-${deriveLookupSku(imgTitle, 'TRV')}`,
                    location: activeImg?.location || 'Sri Lanka',
                    divisionName: 'Mahdev Travels',
                    imageUrl: lightboxImage,
                    description: `Inquiring about ${imgTitle} by Mahdev Travels.`,
                    type: 'gallery',
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Inquire on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
