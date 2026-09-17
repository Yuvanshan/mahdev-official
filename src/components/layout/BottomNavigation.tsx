import React from 'react';
import { Home, Sparkles, Camera, Terminal, Compass, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath, onNavigate }) => {
  const [basePath] = (currentPath ? String(currentPath) : '/').split('?');
  const normalizedPath = (basePath || '/').toLowerCase().replace(/\/$/, '') || '/';

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
      id: 'sws',
      label: 'SWS',
      icon: Sparkles,
      isActive: normalizedPath === '/sws' || normalizedPath.startsWith('/sws/'),
      onClick: () => {
        onNavigate('/sws');
      },
    },
    {
      id: 'u1',
      label: 'U1',
      icon: Camera,
      isActive: normalizedPath === '/u1' || normalizedPath.startsWith('/u1/'),
      onClick: () => {
        onNavigate('/u1');
      },
    },
    {
      id: 'it',
      label: 'IT',
      icon: Terminal,
      isActive: normalizedPath === '/it' || normalizedPath.startsWith('/it/'),
      onClick: () => {
        onNavigate('/it');
      },
    },
    {
      id: 'travels',
      label: 'Travel',
      icon: Compass,
      isActive: normalizedPath === '/travels' || normalizedPath.startsWith('/travels/'),
      onClick: () => {
        onNavigate('/travels');
      },
    },
    {
      id: 'mart',
      label: 'Mart',
      icon: ShoppingBag,
      isActive: normalizedPath === '/mart' || normalizedPath.startsWith('/mart/') || normalizedPath === '/online-mart' || normalizedPath.startsWith('/online-mart/') || normalizedPath === '/shop' || normalizedPath.startsWith('/shop/'),
      onClick: () => {
        onNavigate('/mart');
      },
    },
  ];

  return (
    <nav
      id="floating-bottom-navbar"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center items-center pointer-events-none px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}
    >
      <div className="pointer-events-auto flex items-center justify-between gap-0.5 w-full max-w-[28rem] px-1.5 py-1.5 rounded-full bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-slate-950/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-tab-${item.id}`}
              onClick={item.onClick}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-full transition-all duration-200 cursor-pointer select-none touch-manipulation active:scale-95 ${
                active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF] shadow-md shadow-[#0052FF]/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    active ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
              </div>

              <span className="relative z-10 text-[9px] tracking-tight leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
