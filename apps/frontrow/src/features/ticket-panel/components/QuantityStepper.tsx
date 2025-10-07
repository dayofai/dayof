import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  showTrashIcon: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function QuantityStepper({
  value,
  showTrashIcon,
  canIncrement,
  canDecrement,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        aria-label={showTrashIcon ? 'Remove ticket' : 'Decrease quantity'}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canDecrement}
        onClick={onDecrement}
        type="button"
      >
        {showTrashIcon ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </button>

      <span className="w-8 text-center font-medium tabular-nums">{value}</span>

      <button
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canIncrement}
        onClick={onIncrement}
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
