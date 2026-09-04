import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Building2,
  Tag,
  Share2,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Award,
} from 'lucide-react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { FirestorePortfolio } from '../types/firestore';
import { DIVISIONS } from '../config/divisions';
import { DivisionId } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';
import { ScrollReveal } from '../components/motion/MotionWrappers';

interface ProjectDetailViewProps {
  projectSlugOrId: string;
  onNavigate: (route: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  projectSlugOrId,
  onNavigate,
}) => {
  const { portfolio, divisions, isInitialLoading, isReady } = useFirestoreDataContext();
  const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [projectSlugOrId]);

  // Find target project
  const project = useMemo(() => {
    return portfolio.find(
      (p) =>
        p.id === projectSlugOrId ||
        p.slug === projectSlugOrId ||
        p.slug === decodeURIComponent(projectSlugOrId) ||
        p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === projectSlugOrId.toLowerCase()
    );
  }, [portfolio, projectSlugOrId]);

  // Find related projects (same division or category, excluding current)
  const relatedProjects = useMemo(() => {
    if (!project) return [];
    const divId = project.divisionId || project.division;
    return portfolio
      .filter((p) => p.id !== project.id && (p.divisionId === divId || p.division === divId || p.category === project.category))
      .slice(0, 3);
  }, [portfolio, project]);

  const effectiveDivisionId = (project?.divisionId || project?.division || 'sws') as DivisionId;
  const divisionMeta = DIVISIONS[effectiveDivisionId] || {
    id: effectiveDivisionId,
    name: 'Mahdev Enterprise',
    shortName: 'Mahdev',
    badge: 'Enterprise Capability',
    accentColor: '#0052FF',
    route: `/${effectiveDivisionId}`,
  };

  // Extract gallery images
  const allImages = useMemo(() => {
    if (!project) return [];
    const set = new Set<string>();
    if (project.imageUrl) set.add(project.imageUrl);
    if (Array.isArray(project.images)) {
      project.images.forEach((img) => img && set.add(img));
    }
    if (Array.isArray(project.galleryImages)) {
      project.galleryImages.forEach((img) => img && set.add(img));
    }
    return Array.from(set);
  }, [project]);

  if (!isReady && isInitialLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600 font-mono">
            Loading Project Case Study...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white px-4 py-24">
        <div className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Project Not Found
          </h1>
          <p className="text-slate-500 text-sm">
            The requested project showcase may have been updated or moved. Explore our curated selected work catalog.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => onNavigate('/portfolio')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Selected Work
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const shortIntro =
    project.shortIntroduction ||
    project.summary ||
    project.description ||
    'An enterprise showcase engineered by the Mahdev Group.';

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      <SEOHead
        title={`${project.title} – Mahdev Case Study`}
        description={shortIntro.slice(0, 160)}
        ogTitle={project.title}
        ogDescription={shortIntro.slice(0, 160)}
      />

      {/* Top Breadcrumb & Return Bar */}
      <div className="pt-24 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/portfolio')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Selected Work</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Portfolio</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold capitalize truncate max-w-[200px]">
              {project.category}
            </span>
          </div>
        </div>
      </div>

      {/* 1. PROJECT HEADER & COVER */}
      <section className="pt-10 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            {/* Meta Tags Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {divisionMeta.name}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {project.category}
              </span>
              {project.location && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {project.location}
                </span>
              )}
              {project.year && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {project.year}
                </span>
              )}
            </div>

            {/* Project Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-950 max-w-4xl mb-6 leading-tight">
              {project.title}
            </h1>

            {/* Short Introduction (No wall of text) */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl leading-relaxed font-light mb-10">
              {shortIntro}
            </p>

            {/* Project Specification Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 mb-12">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Division
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {divisionMeta.name}
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Client
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {project.client || 'Enterprise Partner'}
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Location
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {project.location || 'Sri Lanka'}
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Category
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {project.category}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Project Cover Image */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="relative aspect-16/9 sm:aspect-21/9 rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              {project.badge && (
                <div className="absolute top-6 left-6">
                  <Badge variant="electric" size="sm">
                    {project.badge}
                  </Badge>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. CHALLENGE, SOLUTION, RESULT */}
      {(project.challenge || project.solution || project.result || project.fullDescription || (project.impactMetrics && project.impactMetrics.length > 0)) && (
        <section className="py-20 border-b border-slate-100 bg-slate-50/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">
                Execution Breakdown
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
                Craftsmanship, Process & Outcomes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Challenge */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-6">
                    01
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 mb-3">
                    The Challenge
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {project.challenge ||
                      'Delivering uncompromising scale, high aesthetic fidelity, and flawless execution within tight operational deadlines and strict architectural constraints.'}
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-6">
                    02
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 mb-3">
                    The Solution
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {project.solution ||
                      'Engineered precision staging, custom structural rigging, dynamic multi-camera coverage, and dedicated on-site technicians handling every nuance.'}
                  </p>
                </div>
              </div>

              {/* Result */}
              <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-6">
                    03
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mb-3">
                    The Result
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {project.result ||
                      'Flawless delivery that exceeded client expectations, recorded high engagement, and set a new benchmark for production excellence.'}
                  </p>
                </div>

                {project.impactMetrics && project.impactMetrics.length > 0 && (
                  <div className="pt-6 mt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                    {project.impactMetrics.slice(0, 2).map((m, idx) => (
                      <div key={idx}>
                        <div className="text-xl font-bold font-mono text-blue-400">
                          {m.value}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. VIDEO SHOWCASE (IF AVAILABLE) */}
      {project.videoUrl && (
        <section className="py-20 border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">
                Cinematic Recording
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-950">
                Experience the Production in Motion
              </h2>
            </div>

            <div className="relative aspect-16/9 rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-200">
              {project.videoUrl.includes('.mp4') || project.videoUrl.includes('.webm') ? (
                <video
                  src={project.videoUrl}
                  controls
                  poster={project.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : project.videoUrl.includes('youtube.com') || project.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={project.videoUrl.replace('watch?v=', 'embed/')}
                  title={project.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch External Video Stream</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. GALLERY */}
      {allImages.length > 1 && (
        <section className="py-20 border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">
                Visual Documentation
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
                High-Resolution Gallery
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allImages.map((imgUrl, index) => (
                <div
                  key={index}
                  onClick={() => setActiveGalleryImage(imgUrl)}
                  className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200/80 shadow-xs cursor-pointer"
                >
                  <img
                    src={imgUrl}
                    alt={`${project.title} showcase ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-white/90 text-slate-900 text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                      <Eye className="w-3.5 h-3.5" />
                      View High-Res
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. RELATED PROJECTS */}
      {relatedProjects.length > 0 && (
        <section className="py-20 border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">
                  Explore More Work
                </span>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
                  Related Projects
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/portfolio')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Full Portfolio
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProjects.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onNavigate(`/project/${rel.slug || rel.id}`)}
                  className="group rounded-3xl border border-slate-200/80 overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-white flex flex-col"
                >
                  <div className="aspect-16/10 overflow-hidden bg-slate-100 relative">
                    <img
                      src={rel.imageUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs">
                        {rel.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold mb-1">
                        {rel.location || 'Sri Lanka'}
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {rel.summary || rel.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                      <span>View Project</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-3">
            Start Your Engagement
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white mb-6">
            Ready to Build Your Next Milestone?
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect directly with our division directors and production leads to plan your event, media shoot, or software architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('/contact')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Start a Conversation
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate(divisionMeta.route || '/divisions')}
              className="w-full sm:w-auto text-white border-slate-700 hover:bg-slate-900"
            >
              Explore {divisionMeta.name}
            </Button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Gallery Images */}
      {activeGalleryImage && (
        <div
          onClick={() => setActiveGalleryImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeGalleryImage}
              alt="Expanded project showcase"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl mx-auto"
            />
            <button
              onClick={() => setActiveGalleryImage(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold backdrop-blur-xs transition-colors"
            >
              Close [ESC]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
