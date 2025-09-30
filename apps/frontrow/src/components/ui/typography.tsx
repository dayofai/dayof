import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const typographyVariants = cva('text-foreground', {
  variants: {
    variant: {
      h1: 'break-words font-normal text-[64px] leading-[110%] antialiased',
      h2: 'font-semibold text-2xl',
      h3: 'font-semibold text-xl',
      h4: 'font-medium text-lg',
      subtitle:
        'font-normal text-[24px] leading-[120%] tracking-[0.02em] antialiased',
      body: 'text-base leading-relaxed',
      bodySmall: 'text-sm leading-relaxed',
      bodyTiny: 'text-xs leading-relaxed',
      price: 'font-semibold text-2xl',
      button: 'font-bold text-base leading-[120%] tracking-[0.02em]',
      badge: 'text-sm',
    },
    weight: {
      thin: 'font-thin',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      black: 'font-black',
    },
    color: {
      primary: 'text-white',
      secondary: 'text-white/80',
      tertiary: 'text-white/70',
      muted: 'text-white/60',
      disabled: 'text-white/50',
      accent: 'text-[var(--brand-accent)]',
    },
    spacing: {
      none: '',
      tight: 'mb-1',
      normal: 'mb-2',
      loose: 'mb-4',
      section: 'mb-6',
      large: 'mb-8',
    },
  },
  defaultVariants: {
    variant: 'body',
    weight: 'normal',
    color: 'primary',
    spacing: 'none',
  },
});

interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, weight, color, spacing, as = 'p', ...props }, ref) => {
    return React.createElement(as as React.ElementType, {
      className: cn(
        typographyVariants({ variant, weight, color, spacing }),
        className
      ),
      ref,
      ...props,
    });
  }
);
Typography.displayName = 'Typography';

export { Typography, typographyVariants };