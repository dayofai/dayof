import { cva, type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-colors",
  {
    variants: {
      variant: {
        default: 'rounded-full bg-white text-black hover:bg-white/90',
        outline:
          'rounded-full border border-white/20 bg-transparent text-white hover:bg-white/5',
        subtle: 'rounded-full bg-white/10 text-white hover:bg-white/20',
        ghost: 'rounded-none bg-transparent p-0 px-0 text-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-sm',
        icon: 'size-10',
        none: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    href?: string;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  leftIcon,
  rightIcon,
  children,
  href,
  target,
  rel,
  ...props
}: ButtonProps) {
  const isLink = typeof href === 'string' && href.length > 0;
  let Comp: React.ElementType;
  if (asChild) {
    Comp = SlotPrimitive.Slot;
  } else if (isLink) {
    Comp = 'a';
  } else {
    Comp = 'button';
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      data-slot="button"
      {...(isLink ? { href, target, rel } : {})}
      {...props}
    >
      {leftIcon ? (
        <span aria-hidden className="shrink-0">
          {leftIcon}
        </span>
      ) : null}
      <span className="inline-flex items-center">{children}</span>
      {rightIcon ? (
        <span aria-hidden className="shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </Comp>
  );
}

export { Button, buttonVariants };
