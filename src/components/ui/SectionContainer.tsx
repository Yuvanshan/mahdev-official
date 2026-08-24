import React from 'react';

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: 'section' | 'div' | 'article' | 'main';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full' | string;
  background?: 'white' | 'subtle' | 'secondary' | 'electric-gradient' | 'none';
  hasBorderBottom?: boolean;
  hasBorderTop?: boolean;
  className?: string;
  innerClassName?: string;
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  as: Component = 'section',
  maxWidth,
  size,
  background = 'none',
  hasBorderBottom = false,
  hasBorderTop = false,
  paddingY = 'lg',
  className = '',
  innerClassName = '',
  ...props
}) => {
  const effectiveMaxWidth = (maxWidth || size || '7xl') as string;
  const maxWStyles: Record<string, string> = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const bgStyles = {
    white: 'bg-white',
    subtle: 'bg-[#F8FAFC]',
    secondary: 'bg-slate-50',
    'electric-gradient': 'bg-gradient-to-br from-blue-900 via-slate-900 to-black text-white',
    none: '',
  };

  const paddingYStyles = {
    none: 'py-0',
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-24',
    xl: 'py-20 sm:py-32',
  };

  const borderTopStyle = hasBorderTop ? 'border-t border-slate-200/80' : '';
  const borderBottomStyle = hasBorderBottom ? 'border-b border-slate-200/80' : '';

  return (
    <Component
      className={`w-full max-w-full overflow-hidden ${bgStyles[background]} ${paddingYStyles[paddingY]} ${borderTopStyle} ${borderBottomStyle} ${className}`}
      {...props}
    >
      <div className={`w-full max-w-full min-w-0 ${maxWStyles[effectiveMaxWidth] || 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
};
