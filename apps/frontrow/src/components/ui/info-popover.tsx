'use client';

import { Info } from 'lucide-react';
import * as React from 'react';

interface InfoPopoverProps {
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
}

export function InfoPopover(props: InfoPopoverProps) {
  const { children, className, buttonClassName } = props;
  const tooltipId = React.useId();

  return (
    <button
      aria-describedby={tooltipId}
      className={[
        'group relative inline-flex items-center focus:outline-none',
        buttonClassName || '',
      ].join(' ')}
      type="button"
    >
      <Info aria-hidden="true" className="h-3.5 w-3.5" />
      <div
        className={[
          'absolute left-0 z-10 mt-2 hidden min-w-[120px] rounded-md',
          'bg-popover px-3 py-2 text-left text-xs shadow-lg ring-1 ring-border',
          'group-hover:block group-focus:block',
          className || '',
        ].join(' ')}
        id={tooltipId}
        role="tooltip"
      >
        <div className="whitespace-nowrap">{children}</div>
      </div>
    </button>
  );
}
