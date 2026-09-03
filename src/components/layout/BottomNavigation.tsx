import React from 'react';
import { Home, Layers, Briefcase, Sparkles, PhoneCall, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../../context/CartContext';

interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath, onNavigate }) => {
  const { totalQuantity, openCart } = useCart();

  const [basePath] = currentPath.split('?');
  const normalizedPath = basePath.toLowerCase().replace(/\/$/, '') || '/';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: normalizedPath === '/',
      onClick: () => {
        if (normalizedPath === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          onNavigate('/');
        }
      },
    },
    {
      id: 'divisions',
      label: 'Divisions',
      icon: Layers,
      isActive:
        normalizedPath === '/divisions' ||
        normalizedPath.startsWith('/divisions/') ||
        normalizedPath.startsWith('/sws') ||
        normalizedPath.startsWith('/u1') ||
        normalizedPath.startsWith('/it') ||
        normalizedPath.startsWith('/travels') ||
        normalizedPath.startsWith('/mart'),
      onClick: () => {
        onNavigate('/divisions');
      },
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Briefcase,
      isActive:
        normalizedPath === '/portfolio' ||
        normalizedPath === '/projects' ||
        normalizedPath.startsWith('/portfolio/') ||
        normalizedPath.startsWith('/projects/'),
      onClick: () => {
        onNavigate('/projects');
      },
    },
    {
      id: 'services',
      label: 'Services',
      icon: Sparkles,
      isActive:
        normalizedPath === '/services' ||
        normalizedPath.startsWith('/services/') ||
        normalizedPath.startsWith('/service/'),
      onClick: () => {
        onNavigate('/services');
      },
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: PhoneCall,
      isActive: normalizedPath === '/contact',
      onClick: () => {
        onNavigate('/contact');
      },
    },
  ];

  return (
    <nav
      id="floating-bottom-navbar"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center items-center pointer-events-none px-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}
    >
      {/* Floating Pill Container */}
      <div className="pointer-events-auto flex items-center justify-between gap-1 w-full max-w-md px-2 py-1.5 rounded-full bg-slate-950/92 backdrop-blur-xl border border-white/10 shadow-2xl shadow-slate-950/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-tab-${item.id}`}
              onClick={item.onClick}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 cursor-pointer select-none touch-manipulation active:scale-95 ${
                active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active Background Pill Indicator */}
              {active && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    active ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
              </div>

              {/* Short Label */}
              <span className="relative z-10 text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Quick Cart Trigger Pill */}
        <button
          type="button"
          id="nav-tab-cart"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-full text-slate-400 hover:text-white transition-all duration-200 cursor-pointer select-none touch-manipulation active:scale-95 border-l border-white/10 ml-0.5"
          aria-label="Shopping Cart"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-slate-300" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                {totalQuantity}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
            Cart
          </span>
        </button>
      </div>
    </nav>
  );
};
