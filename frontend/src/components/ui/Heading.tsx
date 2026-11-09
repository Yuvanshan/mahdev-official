import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export const DisplayHeading: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Component = 'h1',
  ...props
}) => {
  return (
    <Component
      className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const H1: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Component = 'h1',
  ...props
}) => {
  return (
    <Component
      className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const H2: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Component = 'h2',
  ...props
}) => {
  return (
    <Component
      className={`font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.2] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const H3: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Component = 'h3',
  ...props
}) => {
  return (
    <Component
      className={`font-display text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 leading-[1.25] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const H4: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Component = 'h4',
  ...props
}) => {
  return (
    <Component
      className={`font-display text-lg sm:text-xl font-medium tracking-tight text-slate-900 leading-[1.3] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const BodyLarge: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`text-lg sm:text-xl text-slate-600 font-normal leading-[1.6] max-w-prose ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`text-base text-slate-600 font-normal leading-[1.65] max-w-prose ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`text-xs text-slate-500 font-medium tracking-wide uppercase ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
