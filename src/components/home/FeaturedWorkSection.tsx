import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Sparkles, TrendingUp, X } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
} from '../motion/MotionWrappers';
import { cmsService } from '../../services/cmsService';
import { CmsPortfolioProject, HomepageCmsConfig } from '../../types/cms';
import { DIVISIONS } from '../../config/divisions';
import { DivisionId } from '../../types';

interface FeaturedWorkSectionProps {
  onNavigate: (route: string) => void;
}

export const FeaturedWorkSection: React.FC<FeaturedWorkSectionProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<CmsPortfolioProject[]>([]);
  const [config, setConfig] = useState<HomepageCmsConfig>(() => cmsService.getHomepageConfig());
  const [selectedProject, setSelectedProject] = useState<CmsPortfolioProject | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const all = cmsService.getAll<CmsPortfolioProject>('portfolio', { status: 'active' });
    setProjects(all);
    setConfig(cmsService.getHomepageConfig());
  };

  useEffect(() => {
    loadData();
    const unsubPortfolio = cmsService.subscribe('portfolio', loadData);
    const unsubHome = cmsService.subscribeHomepage(loadData);
    return () => {
      unsubPortfolio();
      unsubHome();
    };
  }, []);

  if (config.portfolio && !config.portfolio.enabled) {
    return null;
  }

  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const sectionMeta = config.portfolio || {
    badge: 'PORTFOLIO & CASE STUDIES',
    title: 'Featured Work & Engagements',
    subtitle: 'A curated selection of hallmark productions, digital systems, expeditions, and media projects delivered across our enterprise divisions.',
  };

  return (
    <SectionContainer
      id="portfolio"
      background="subtle"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block font-bold uppercase tracking-wider">
              {sectionMeta.badge || 'Portfolio & Case Studies'}
            </Caption>
            <H2 className="text-slate-900 mb-3">{sectionMeta.title || 'Featured Work & Engagements'}</H2>
            <Body className="text-slate-600 text-base">
              {sectionMeta.subtitle ||
                'A curated selection of hallmark productions, digital systems, expeditions, and media projects delivered across our enterprise divisions.'}
            </Body>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {/* Horizontal Scroll Controls */}
            <div className="flex items-center gap-2">
              <Magnetic strength={0.2}>
                <button
                  onClick={() => scrollHorizontal('left')}
                  className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-[#0052FF] shadow-xs cursor-pointer transition-all"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <button
                  onClick={() => scrollHorizontal('right')}
                  className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-[#0052FF] shadow-xs cursor-pointer transition-all"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Magnetic>
            </div>
            <Badge variant="electric">CMS Live Portfolio</Badge>
          </div>
        </div>
      </ScrollReveal>

      {/* Horizontal Storytelling Showcase Rail */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project, idx) => (
          <div
            key={project.id}
            className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 snap-start"
          >
            <ScrollReveal direction="up" delay={idx * 0.08}>
              <TiltCard
                maxTilt={8}
                glareEffect
                onClick={() => setSelectedProject(project)}
                className="h-[440px] cursor-pointer"
              >
                <div className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md h-full flex flex-col justify-end p-6 sm:p-7 text-white transition-all duration-500 hover:shadow-2xl">
                  {/* Background Image with parallax feel */}
                  <img
                    src={project.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-108 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="electric"
                        size="sm"
                        className="bg-[#0052FF] text-white border-transparent shadow-xs"
                      >
                        {project.badge || project.divisionName}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {project.client} • {project.year}
                      </span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      {project.summary}
                    </p>

                    <div className="pt-3 flex items-center justify-between border-t border-white/10">
                      {project.metric && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-blue-300">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>
                            {project.metric.label}: {project.metric.value}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ml-auto">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          </div>
        ))}
      </div>

      {/* Interactive Case Study Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                {selectedProject.badge || 'Delivered Project'}
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                {selectedProject.divisionName} • {selectedProject.year}
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">
              {selectedProject.title}
            </h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Client: {selectedProject.client}
            </p>

            <div className="rounded-xl overflow-hidden mb-5 max-h-60 bg-slate-100">
              <img
                src={selectedProject.imageUrl}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {selectedProject.summary}
            </p>

            {selectedProject.highlights && selectedProject.highlights.length > 0 && (
              <div className="space-y-2 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Key Project Highlights:
                </span>
                {selectedProject.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700">
                {selectedProject.metric && (
                  <>
                    Performance:{' '}
                    <span className="text-[#0052FF]">
                      {selectedProject.metric.label} ({selectedProject.metric.value})
                    </span>
                  </>
                )}
              </div>
              <Magnetic strength={0.25}>
                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => {
                    const div = DIVISIONS[selectedProject.divisionId as DivisionId];
                    const route = div ? div.route : '/portfolio';
                    setSelectedProject(null);
                    onNavigate(route);
                  }}
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="cursor-pointer"
                >
                  Explore Division
                </Button>
              </Magnetic>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
