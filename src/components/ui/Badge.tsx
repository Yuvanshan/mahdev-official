import React from 'react';

export type BadgeVariant = 'default' | 'electric' | 'secondary' | 'outline' | 'success' | 'warning';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[11px] leading-none px-2.5 py-1',
    md: 'text-xs leading-none px-3 py-1.5',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200/70',
    electric: 'bg-blue-50 text-[#0052FF] border border-blue-200/80 font-semibold',
    secondary: 'bg-slate-900 text-white border border-slate-900',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
