import React, { useState } from 'react';
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
} from 'lucide-react';
import { TRAVEL_STORIES, TravelStory } from '../../data/travelsData';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';

export const TravelsGalleryStoriesSection: React.FC = () => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const galleryImages = [
    {
      src: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
      title: 'Sigiriya Lion Rock Citadel at Sunrise',
      location: 'Central Province',
    },
    {
      src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      title: 'Ceylon Blue Train Traversing Nine Arch Bridge',
      location: 'Ella Highlands',
    },
    {
      src: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
      title: 'Sri Lankan Leopard on Granite Outcrop',
      location: 'Yala National Park',
    },
    {
      src: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
      title: 'Galle Fort Ramparts at Golden Hour',
      location: 'Southern Coast',
    },
    {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      title: 'Turquoise Waters & Reefs of Pigeon Island',
      location: 'Trincomalee Coast',
    },
    {
      src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
      title: 'Sacred Temple of the Tooth & Royal Lake',
      location: 'Kandy Royal City',
    },
  ];

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
        {galleryImages.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setLightboxImage(img.src)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
          >
            <img
              src={img.src}
              alt={img.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                {img.location}
              </span>
              <h4 className="font-display text-xs sm:text-sm font-bold text-white leading-tight">
                {img.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* 2. TRAVEL STORIES & GUEST TESTIMONIALS */}
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
        {TRAVEL_STORIES.map((story) => (
          <div
            key={story.id}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Rating stars */}
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(story.rating)].map((_, i) => (
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

      {/* Full-Screen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged gallery photo"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </SectionContainer>
  );
};
