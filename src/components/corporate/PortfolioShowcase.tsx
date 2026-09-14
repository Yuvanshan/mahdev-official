import React, { useState, useMemo } from 'react';
import { ExternalLink, Filter, Sparkles, TrendingUp, Layers, CheckCircle2, ChevronRight, Image as ImageIcon, X, MessageCircle } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../motion/MotionWrappers';
import { PortfolioProject, DivisionId } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { DataLoadingOverlay } from '../common/DataLoadingOverlay';

interface PortfolioShowcaseProps {
  onInquireProject?: (project: PortfolioProject) => void;
  onNavigate?: (route: string) => void;
  initialDivision?: DivisionId | 'all';
}

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({
  onInquireProject,
  onNavigate,
  initialDivision = 'all',
}) => {
  const { portfolio, isInitialLoading, isFetching } = useFirestoreDataContext();
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  const projects: PortfolioProject[] = useMemo(() => {
    const activeList = portfolio.filter((p) => (p as any).status !== 'archived');
    return activeList.map((p) => ({
      id: p.id,
      title: p.title,
      divisionId: ((p as any).divisionId || p.division || 'sws') as DivisionId,
      category: p.category || 'Production',
      client: p.client || 'Private Client',
      year: p.year ? String(p.year) : '2025',
      summary: p.summary || '',
      fullDescription: p.fullDescription || p.summary || '',
      highlights: p.highlights || [],
      deliverables: p.deliverables || [],
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      galleryImages: p.galleryImages || [p.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'],
      liveUrl: p.liveUrl,
      impactMetrics: p.impactMetrics || [],
      tags: p.tags || ['Enterprise', 'Production'],
      sku: (p as any).sku,
    }));
  }, [portfolio]);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category)))];

  const filteredProjects = projects.filter((p) => {
    const matchDivision = selectedDivision === 'all' || p.divisionId === selectedDivision;
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchDivision && matchCategory;
  });

  const divisionLabels: Record<DivisionId | 'all', string> = {
    all: 'All Projects',
    sws: 'SWS Event Management',
    u1: 'U1 Studio Cinema',
    it: 'IT & Cloud Solutions',
    travels: 'Mahdev Travels',
    mart: 'Mart & Other Projects',
  };

  const getDivisionBadge = (divId: DivisionId) => {
    switch (divId) {
      case 'sws':
        return 'Events & Production';
      case 'u1':
        return 'Media & Film';
      case 'it':
        return 'Tech & Engineering';
      case 'travels':
        return 'Luxury Travel';
      case 'mart':
        return 'Procurement';
      default:
        return 'Mahdev';
    }
  };

  return (
    <SectionContainer id="portfolio" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block">Portfolio & Case Studies</Caption>
            <H2 className="text-slate-900 mb-3">Hallmark Engagements</H2>
            <Body className="text-slate-600 text-base">
              A curated catalog of premier events, cinema-grade films, enterprise software architectures, and luxury travel operations.
            </Body>
          </div>

          <div className="mt-4 md:mt-0">
            <Badge variant="electric" size="md">
              {filteredProjects.length} Projects Available
            </Badge>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter Controls: Division Pills + Category Tabs */}
      <div className="space-y-4 mb-10">
        {/* Division Selector */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          {(['all', 'sws', 'u1', 'it', 'travels', 'mart'] as (DivisionId | 'all')[]).map((divId) => (
            <button
              key={divId}
              onClick={() => {
                setSelectedDivision(divId);
                setSelectedCategory('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDivision === divId
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {divisionLabels[divId]}
            </button>
          ))}
        </div>

        {/* Category Pill Sub-filter */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Grid */}
      {isInitialLoading || (isFetching && portfolio.length === 0) ? (
        <div className="relative min-h-[360px] rounded-3xl border border-slate-200 bg-slate-50/50 overflow-hidden">
          <DataLoadingOverlay
            message="Loading Showcase"
            subMessage="Curating landmark projects..."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, idx) => (
            <ScrollReveal key={project.id} direction="up" delay={idx * 0.06}>
              <TiltCard
                maxTilt={6}
                glareEffect
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(`/project/${project.id}`);
                  } else {
                    setSelectedProject(project);
                    setActiveGalleryIndex(0);
                  }
                }}
                className="h-[460px] cursor-pointer"
              >
              <div className="group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md h-full flex flex-col justify-end p-6 sm:p-7 text-white transition-all duration-500 hover:shadow-2xl">
                {/* Image background with scale effect */}
                <img
                  src={
                    project.imageUrl && project.imageUrl.trim() !== ''
                      ? project.imageUrl.trim()
                      : 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-75 transition-all duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                  <Badge variant="electric" size="sm" className="backdrop-blur-md bg-blue-600/90 text-white font-medium">
                    {getDivisionBadge(project.divisionId)}
                  </Badge>
                  <span className="text-[11px] font-mono font-bold bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 text-slate-300">
                    {project.year}
                  </span>
                </div>

                {/* Bottom Content Narrative */}
                <div className="relative z-10 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                      {project.client}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {project.summary}
                  </p>

                  {/* Impact Metric Bar */}
                  {project.impactMetrics && project.impactMetrics.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {project.impactMetrics[0].label}
                        </span>
                        <span className="font-display font-bold text-lg text-white">
                          {project.impactMetrics[0].value}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const itemLink = typeof window !== 'undefined' ? `${window.location.origin}/project/${project.id}` : undefined;
                            openWhatsAppInquiry({
                              title: project.title,
                              sku: project.sku || `PORT-${project.divisionId.toUpperCase()}-${project.id.slice(-4)}`,
                              category: project.category,
                              divisionName: project.divisionId ? project.divisionId.toUpperCase() : undefined,
                              imageUrl: project.imageUrl,
                              itemUrl: itemLink,
                              description: project.summary,
                              type: 'portfolio',
                            });
                          }}
                          title="WhatsApp Inquiry with Image"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 px-2.5 py-1.5 rounded-full transition-all cursor-pointer active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052FF] bg-white px-3 py-1.5 rounded-full shadow-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          Explore <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
      )}

      {/* Rich Project Detail Modal with Image Gallery Lightbox */}
      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title || 'Case Study'}
        size="xl"
      >
        {selectedProject && (
          <div className="space-y-6">
            {/* Gallery Lightbox Preview */}
            <div className="space-y-3">
              {(() => {
                const allImages = [
                  selectedProject.imageUrl,
                  ...(selectedProject.galleryImages || []),
                ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');
                const fallbackImg =
                  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
                const activeImg = allImages[activeGalleryIndex] || allImages[0] || fallbackImg;

                return (
                  <div>
                    <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={activeImg}
                        alt={selectedProject.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="electric" size="sm">
                          {getDivisionBadge(selectedProject.divisionId)}
                        </Badge>
                      </div>
                    </div>

                    {/* Thumbnail Selector */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 pt-2 overflow-x-auto pb-1">
                        {allImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveGalleryIndex(i)}
                            className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                              activeGalleryIndex === i
                                ? 'border-[#0052FF] ring-2 ring-blue-500/20 scale-105'
                                : 'border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${i + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Project Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Client</span>
                <span className="font-bold text-slate-900">{selectedProject.client}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Year</span>
                <span className="font-bold text-slate-900">{selectedProject.year}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Category</span>
                <span className="font-bold text-slate-900">{selectedProject.category}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block mb-0.5">Division</span>
                <span className="font-bold text-[#0052FF]">{divisionLabels[selectedProject.divisionId]}</span>
              </div>
            </div>

            {/* Deep Project Description */}
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Project Overview & Execution
              </h4>
              <p>{selectedProject.fullDescription || selectedProject.summary}</p>
            </div>

            {/* Key Deliverables & Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Hallmark Highlights
                </span>
                {selectedProject.highlights.map((hl, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              {selectedProject.deliverables && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Core Deliverables
                  </span>
                  {selectedProject.deliverables.map((del, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Sparkles className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Impact Metrics Row */}
            {selectedProject.impactMetrics && selectedProject.impactMetrics.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white flex flex-wrap items-center justify-around gap-4">
                {selectedProject.impactMetrics.map((met, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display font-bold text-2xl text-white">
                      {met.value}
                    </div>
                    <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                      {met.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {selectedProject.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tags.map((t) => (
                    <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const allImages = [
                      selectedProject.imageUrl,
                      ...(selectedProject.galleryImages || []),
                    ];
                    const activeImg = allImages[activeGalleryIndex] || selectedProject.imageUrl;
                    const itemLink = typeof window !== 'undefined' ? `${window.location.origin}/project/${selectedProject.id}` : undefined;
                    openWhatsAppInquiry({
                      title: selectedProject.title,
                      sku: selectedProject.sku || `PORT-${selectedProject.divisionId.toUpperCase()}-${selectedProject.id.slice(-4)}`,
                      category: selectedProject.category,
                      divisionName: selectedProject.divisionId ? selectedProject.divisionId.toUpperCase() : undefined,
                      imageUrl: activeImg,
                      itemUrl: itemLink,
                      description: selectedProject.summary,
                      type: 'portfolio',
                    });
                  }}
                  title="Send inquiry with currently viewed image to WhatsApp"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>WhatsApp Inquiry</span>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                >
                  Close Case Study
                </Button>
                <Button
                  size="sm"
                  variant="electric"
                  onClick={() => {
                    const proj = selectedProject;
                    setSelectedProject(null);
                    if (onInquireProject) {
                      onInquireProject(proj);
                    } else {
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Inquire For Similar Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SectionContainer>
  );
};
