import { Minus, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

interface QuantityStepperProps {
  value: number;
  showTrashIcon: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  ariaDescribedById?: string;
}

export function QuantityStepper({
  value,
  showTrashIcon,
  canIncrement,
  canDecrement,
  onIncrement,
  onDecrement,
  ariaDescribedById,
}: QuantityStepperProps) {
  // Entrance animation for stepper, bump animation for value
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    setEntered(true);
  }, []);

  const [bump, setBump] = React.useState(false);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (value !== prev.current && value > 0) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 150);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  const showControls = value > 0;

  return (
    <div
      className={[
        'inline-flex items-center gap-2',
        'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
        entered
          ? 'motion-safe:scale-100 motion-safe:opacity-100'
          : 'motion-safe:scale-95 motion-safe:opacity-0',
      ].join(' ')}
    >
      <button
        aria-label={
          showControls && showTrashIcon ? 'Remove ticket' : 'Decrease quantity'
        }
        className={[
          'flex items-center justify-center overflow-hidden rounded-sm border border-border transition-colors hover:bg-muted disabled:cursor-not-allowed',
          'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
          showControls
            ? 'h-[26px] w-[26px] cursor-pointer opacity-100'
            : 'h-[26px] w-0 opacity-0',
        ].join(' ')}
        disabled={!(canDecrement && showControls)}
        onClick={onDecrement}
        type="button"
      >
        {showTrashIcon ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </button>

      <span
        className={[
          'overflow-hidden text-center font-medium tabular-nums',
          'motion-safe:transition-all motion-safe:duration-250',
          showControls ? 'w-8 opacity-100' : 'w-0 opacity-0',
          showControls && bump
            ? 'motion-safe:scale-110'
            : 'motion-safe:scale-100',
        ].join(' ')}
      >
        {value}
      </span>

      <button
        aria-describedby={ariaDescribedById}
        aria-label="Increase quantity"
        className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border border-border transition-colors hover:bg-muted disabled:cursor-not-allowed"
        disabled={!canIncrement}
        onClick={onIncrement}
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
