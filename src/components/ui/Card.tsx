import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from './Badge';
import { IconRenderer } from './IconRenderer';
import { DivisionConfig } from '../../types';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'subtle';
  hoverEffect?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-sm',
    elevated: 'bg-white border border-slate-100 shadow-md',
    bordered: 'bg-white border-2 border-slate-200 shadow-none',
    subtle: 'bg-slate-50/70 border border-slate-200/60 shadow-none',
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-300 hover:border-[#0052FF]/60 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-xl p-6 sm:p-7 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-2 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`font-display text-xl font-semibold text-slate-900 tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-sm text-slate-600 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return <div className={`space-y-4 ${className}`} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`mt-6 pt-4 border-t border-slate-100 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface DivisionCardProps {
  division: DivisionConfig;
  onNavigate: (route: string) => void;
  className?: string;
}

export const DivisionCard: React.FC<DivisionCardProps> = ({
  division,
  onNavigate,
  className = '',
}) => {
  return (
    <div
      onClick={() => onNavigate(division.route)}
      className={`group relative flex flex-col justify-between rounded-xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:border-[#0052FF] hover:shadow-xl hover:shadow-blue-500/15 cursor-pointer overflow-hidden ${className}`}
    >
      {/* Subtle top indicator bar with electric blue gradient on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center transition-colors group-hover:bg-[#0052FF] group-hover:text-white">
            <IconRenderer name={division.iconName} className="w-6 h-6" />
          </div>
          <Badge variant="electric">{division.badge}</Badge>
        </div>

        <h3 className="font-display text-xl font-bold text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
          {division.name}
        </h3>
        <p className="text-xs font-semibold text-[#0052FF] mb-3">
          {division.tagline}
        </p>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6">
          {division.description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-900 group-hover:text-[#0052FF] transition-colors">
        <span>Explore Division</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
