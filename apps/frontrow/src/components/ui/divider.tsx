import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const dividerVariants = cva('border-gray-300 dark:border-gray-700', {
  variants: {
    spacing: {
      none: '',
      tight: 'my-4',
      normal: 'my-6',
      loose: 'my-8',
      section: 'my-12',
      large: 'my-16',
    },
  },
  defaultVariants: {
    spacing: 'section',
  },
});

interface DividerProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {}

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, spacing, ...props }, ref) => {
    return (
      <hr
        className={cn(dividerVariants({ spacing }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Divider.displayName = 'Divider';

export { Divider, dividerVariants };
