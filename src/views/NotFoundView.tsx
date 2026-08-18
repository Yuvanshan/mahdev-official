import React from 'react';
import { Home, Compass, ArrowRight, Search, Sparkles, Building2, ShoppingBag, Calendar } from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { DisplayHeading, H3, BodyLarge, Body } from '../components/ui/Heading';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';
import { FadeIn, SlideIn } from '../components/motion/MotionWrappers';
import { DIVISION_LIST } from '../config/divisions';

interface NotFoundViewProps {
  onNavigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full min-h-[75vh] flex flex-col justify-center py-20 bg-slate-50/50">
      <SEOHead
        title="404 — Page Not Found | Mahdev Pvt Ltd"
        description="The requested page could not be located within the Mahdev Pvt Ltd corporate network."
        noIndex={true}
      />

      <SectionContainer size="md" className="text-center">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-blue-50 rounded-2xl border border-blue-100 text-[#0052FF]">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
        </FadeIn>

        <SlideIn direction="up" delay={0.2}>
          <div className="space-y-2">
            <Badge variant="outline" size="sm">
              ERROR 404 — ROUTE NOT FOUND
            </Badge>
            <DisplayHeading className="text-slate-950 text-4xl sm:text-5xl font-black">
              Page Not Found
            </DisplayHeading>
          </div>
        </SlideIn>

        <SlideIn direction="up" delay={0.3}>
          <BodyLarge className="text-slate-600 max-w-lg mx-auto mt-4">
            The page or resource you are looking for may have been relocated, renamed, or is temporarily offline.
          </BodyLarge>
        </SlideIn>

        <SlideIn direction="up" delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Button
              variant="electric"
              size="lg"
              onClick={() => onNavigate('/')}
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return Home
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('/catalog')}
              leftIcon={<ShoppingBag className="w-4 h-4" />}
            >
              Explore Products
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('/book')}
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Book Services
            </Button>
          </div>
        </SlideIn>

        {/* Quick Division Directory */}
        <div className="mt-16 pt-12 border-t border-slate-200/80 max-w-2xl mx-auto text-left">
          <H3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
            Corporate Divisions Directory
          </H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIVISION_LIST.map((div) => (
              <button
                key={div.id}
                onClick={() => onNavigate(div.route)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF] hover:shadow-sm transition-all group text-left cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-[#0052FF]">
                    {div.name}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">{div.tagline}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0052FF] group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
