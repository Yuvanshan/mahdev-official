import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

/** Icon button that switches between light and dark. Uses currentColor so it fits any header. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current/20 bg-transparent text-current transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
