import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'electric' | 'danger' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98] select-none cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[42px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0052FF] bg-gradient-to-r from-[#0052FF] to-[#003BB3] hover:from-[#0045D8] hover:to-[#002B99] text-white shadow-sm hover:shadow-md hover:shadow-blue-600/20 border border-[#0052FF]',
    electric:
      'bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF] text-white hover:opacity-95 shadow-md shadow-blue-500/25 border border-transparent',
    secondary:
      'bg-blue-50 text-[#0052FF] hover:bg-blue-100/80 border border-blue-200/80',
    outline:
      'bg-transparent text-[#0052FF] hover:bg-blue-50/60 border border-blue-300 hover:border-[#0052FF]',
    ghost:
      'bg-transparent text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/60 border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600 hover:border-red-700',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600 hover:border-red-700',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
