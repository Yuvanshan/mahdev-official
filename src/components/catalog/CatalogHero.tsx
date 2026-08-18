import React from 'react';
import { motion } from 'motion/react';
import { Database, Search, Layers, Box, Cpu, Sparkles, Compass } from 'lucide-react';

interface CatalogHeroProps {
  totalProducts: number;
  totalCategories: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CatalogHero: React.FC<CatalogHeroProps> = ({
  totalProducts,
  totalCategories,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <section className="relative pt-32 pb-16 bg-neutral-900 text-white overflow-hidden border-b border-neutral-800">
      {/* Background Subtle Tech/Artisanal Glow & Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700/80 text-amber-400 text-xs tracking-wider uppercase font-medium mb-6 backdrop-blur-md"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Mahdev Unified Enterprise Catalog</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-white mb-6"
          >
            Product & Service <br />
            <span className="italic font-light text-amber-200/90">Catalog System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-neutral-300 font-light leading-relaxed mb-8 max-w-2xl"
          >
            A unified inventory and product intelligence architecture spanning all five Mahdev divisions: Pure Ceylon Goods, Enterprise IT Systems, Event Productions, Cinema Assets, and Curated Travels.
          </motion.p>

          {/* Quick Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-amber-400">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white tracking-tight">{totalProducts}</p>
                <p className="text-xs text-neutral-400">Active SKUs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white tracking-tight">{totalCategories}</p>
                <p className="text-xs text-neutral-400">Taxonomy Categories</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white tracking-tight">5</p>
                <p className="text-xs text-neutral-400">Product Models</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white tracking-tight">100%</p>
                <p className="text-xs text-neutral-400">Single Source of Truth</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
