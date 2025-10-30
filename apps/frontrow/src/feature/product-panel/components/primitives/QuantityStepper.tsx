import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityStepperProps {
  /**
   * Current quantity value
   */
  value: number;
  /**
   * Minimum allowed value (default: 0)
   */
  min?: number;
  /**
   * Maximum allowed value (default: Infinity)
   */
  max?: number;
  /**
   * Callback when quantity changes
   */
  onChange: (newValue: number) => void;
  /**
   * Disable all controls
   */
  disabled?: boolean;
  /**
   * Optional CSS class
   */
  className?: string;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Quantity stepper component with +/- buttons
 *
 * Accessible keyboard navigation and proper ARIA attributes.
 * Automatically disables increment/decrement when limits are reached.
 *
 * @example
 * ```tsx
 * <QuantityStepper
 *   value={quantity}
 *   max={10}
 *   onChange={setQuantity}
 * />
 * ```
 */
export function QuantityStepper({
  value,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement && !disabled) {
      onChange(Math.max(min, value - 1));
    }
  };

  const handleIncrement = () => {
    if (canIncrement && !disabled) {
      onChange(Math.min(max, value + 1));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) {
      return;
    }

    if (e.key === 'ArrowUp' || e.key === '+') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-11 w-11 text-lg',
  };

  const buttonSize = sizeClasses[size];

  return (
    <fieldset
      aria-label="Quantity selector"
      className={`inline-flex items-center gap-2 ${className}`.trim()}
      disabled={disabled}
    >
      <Button
        aria-label="Decrease quantity"
        className={buttonSize}
        disabled={disabled || !canDecrement}
        onClick={handleDecrement}
        onKeyDown={handleKeyDown}
        size="icon"
        type="button"
        variant="outline"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <output
        aria-atomic="true"
        aria-live="polite"
        className="inline-flex min-w-[3ch] items-center justify-center tabular-nums"
      >
        {value}
      </output>

      <Button
        aria-label="Increase quantity"
        className={buttonSize}
        disabled={disabled || !canIncrement}
        onClick={handleIncrement}
        onKeyDown={handleKeyDown}
        size="icon"
        type="button"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </fieldset>
  );
}
