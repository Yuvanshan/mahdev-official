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
    default: 'bg-purple-50/60 text-purple-900 border border-purple-200/60',
    electric: 'bg-purple-100/70 text-purple-700 border border-purple-200/80 font-semibold',
    secondary: 'bg-purple-950 text-white border border-purple-950',
    outline: 'bg-transparent text-purple-900 border border-purple-300',
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
