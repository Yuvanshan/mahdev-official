import React, { useMemo } from 'react';
import {
  Smartphone,
  ShoppingBag,
  Home,
  ChevronRight,
  Package,
  Sparkles,
  Zap,
  Headphones,
  Laptop,
} from 'lucide-react';
import { MART_CATEGORIES, MartCategory, mapFirestoreCategoryToMart } from '../../data/martData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';

interface MartCategoriesSectionProps {
  onSelectCategory: (categoryId: string) => void;
}

export const MartCategoriesSection: React.FC<MartCategoriesSectionProps> = ({
  onSelectCategory,
}) => {
  const { categories: rawCategories } = useFirestoreDataContext();

  const categories = useMemo<MartCategory[]>(() => {
    if (rawCategories && rawCategories.length > 0) {
      const martCats = rawCategories.filter(
        (c) => !c.division || c.division === 'mart' || (c as any).divisionId === 'mart'
      );
      if (martCats.length > 0) {
        return martCats.map(mapFirestoreCategoryToMart);
      }
    }
    return [];
  }, [rawCategories]);

  if (categories.length === 0) {
    return null;
  }

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-indigo-500" />;
      case 'Headphones':
        return <Headphones className="w-5 h-5 text-rose-500" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-teal-600" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-purple-600" />;
      case 'Package':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'Home':
      default:
        return <Home className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <SectionContainer id="categories" background="white" paddingY="lg" hasBorderBottom>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF] mb-1 block font-mono">
              Curated Departments
            </Caption>
            <H2 className="text-slate-900">Explore by Category</H2>
          </ScrollReveal>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="group p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#0052FF] hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-slate-200/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.iconName)}
              </div>

              <div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug line-clamp-2">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {cat.itemCount} Products
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] font-semibold text-blue-600">
              <span>Browse</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
