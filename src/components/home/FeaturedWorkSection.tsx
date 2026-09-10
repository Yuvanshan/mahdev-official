import React, { useRef } from 'react';
import { ArrowRight, MapPin, Layers, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISIONS } from '../../config/divisions';
import { DivisionId } from '../../types';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

interface FeaturedWorkSectionProps {
  onNavigate: (route: string) => void;
}

export const FeaturedWorkSection: React.FC<FeaturedWorkSectionProps> = (props) => {
  const { portfolio, homepageConfig } = useFirestoreDataContext();

  if (homepageConfig.portfolio && !homepageConfig.portfolio.enabled) {
    return null;
  }

  const activeProjects = portfolio.filter(
    (p) => (p as any).status !== 'archived' && (p as any).status !== 'draft'
  );

  // If no projects exist in Firestore, hide the section cleanly as required by Requirement 30
  if (activeProjects.length === 0) {
    return null;
  }

  return <FeaturedWorkSectionContent {...props} activeProjects={activeProjects} />;
};

const FeaturedWorkSectionContent: React.FC<
  FeaturedWorkSectionProps & { activeProjects: any[] }
> = ({ onNavigate, activeProjects }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yHero = useTransform(smoothProgress, [0, 1], ['-15px', '15px']);

  const getDivisionLabel = (divId: string | undefined) => {
    if (!divId) return 'Mahdev Group';
    const found = DIVISIONS[divId as DivisionId];
    return found ? found.name : divId.toUpperCase();
  };

  const featuredHeroProject = activeProjects[0];
  const gridProjects = activeProjects.slice(1);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="04 // PORTFOLIO" />
      <SectionContainer
        id="portfolio"
        background="white"
        paddingY="xl"
        hasBorderBottom
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2 font-mono">
              Portfolio
            </span>
            <H2 className="text-slate-950 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
              SELECTED WORK
            </H2>
            <Body className="text-slate-600 text-base mt-2 max-w-xl">
              Curated productions, digital solutions, studio media, and bespoke operations engineered across our divisions.
            </Body>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              onClick={() => onNavigate('/portfolio')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-blue-600 transition-colors group cursor-pointer"
            >
              <span>View All Work</span>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Editorial Grid */}
        <div className="space-y-8">
          {/* Full-Width Feature Hero Project */}
          {featuredHeroProject && (
            <motion.div
              style={!reducedMotion && !isTouch ? { y: yHero } : undefined}
              onClick={() =>
                onNavigate(`/project/${featuredHeroProject.slug || featuredHeroProject.id}`)
              }
              className="group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Large Project Image */}
              <div className="lg:col-span-7 relative aspect-16/10 lg:aspect-auto min-h-[320px] sm:min-h-[420px] overflow-hidden bg-slate-900">
                <img
                  src={featuredHeroProject.imageUrl}
                  alt={featuredHeroProject.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:hidden" />
              </div>

              {/* Project Meta and Narrative Content */}
              <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-slate-950 text-white">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs font-mono">
                      {getDivisionLabel(featuredHeroProject.divisionId || featuredHeroProject.division)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
                      {featuredHeroProject.category}
                    </span>
                    {featuredHeroProject.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-auto font-mono">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {featuredHeroProject.location}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors mb-4">
                    {featuredHeroProject.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed line-clamp-3">
                    {featuredHeroProject.summary || featuredHeroProject.description}
                  </p>
                </div>

                <div className="pt-8 mt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Client: {featuredHeroProject.client || 'Enterprise Partner'}
                  </span>
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 group-hover:text-white transition-colors">
                    <span>View Project</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Asymmetric Editorial Grid for Remaining Projects */}
          {gridProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {gridProjects.map((project, idx) => {
                const isLargeSpan = idx % 5 === 0;

                return (
                  <div
                    key={project.id}
                    className={isLargeSpan ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'}
                  >
                    <div
                      onClick={() =>
                        onNavigate(`/project/${project.slug || project.id}`)
                      }
                      className="group h-full rounded-3xl overflow-hidden bg-white border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Large Project Image */}
                        <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                              {project.category}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-7">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                            <span className="text-blue-600 uppercase tracking-wider font-bold font-mono">
                              {getDivisionLabel(project.divisionId || project.division)}
                            </span>
                            {project.location && (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {project.location}
                              </span>
                            )}
                          </div>

                          <h4 className="font-display text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                            {project.title}
                          </h4>

                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {project.summary || project.description}
                          </p>
                        </div>
                      </div>

                      {/* View project arrow */}
                      <div className="px-6 sm:px-7 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        <span className="text-slate-400 font-normal">
                          {project.client || 'Client Project'}
                        </span>
                        <div className="inline-flex items-center gap-1.5">
                          <span>View Project</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionContainer>
    </div>
  );
};
