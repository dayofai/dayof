// @vitest-environment jsdom
/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuantityStepper } from '../QuantityStepper';

describe('QuantityStepper', () => {
  describe('Basic functionality', () => {
    it('renders with initial value of 0', () => {
      render(
        <QuantityStepper
          canDecrement={false}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={0}
        />
      );

      expect(screen.getByText('0')).toBeDefined();
      expect(screen.getByLabelText('Increase quantity')).toBeDefined();
    });

    it('renders with positive value', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={3}
        />
      );

      expect(screen.getByText('3')).toBeDefined();
      expect(screen.getByLabelText('Increase quantity')).toBeDefined();
      expect(screen.getByLabelText('Decrease quantity')).toBeDefined();
    });

    it('calls onIncrement when plus button is clicked', () => {
      const onIncrement = vi.fn();
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={onIncrement}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(plusButton);
      expect(onIncrement).toHaveBeenCalledTimes(1);
    });

    it('calls onDecrement when minus button is clicked', () => {
      const onDecrement = vi.fn();
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={2}
        />
      );

      const minusButton = screen.getByLabelText('Decrease quantity');
      fireEvent.click(minusButton);
      expect(onDecrement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button states and visibility', () => {
    it('shows controls when value > 0', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const minusButton = screen.getByLabelText('Decrease quantity');
      const plusButton = screen.getByLabelText('Increase quantity');

      expect(minusButton).toBeDefined();
      expect(plusButton).toBeDefined();
    });

    it('hides minus button when value is 0', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={0}
        />
      );

      // The minus button should be disabled and visually hidden when value is 0
      const minusButton = screen.getByLabelText('Decrease quantity');
      expect((minusButton as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByLabelText('Increase quantity')).toBeDefined();
    });

    it('disables increment button when canIncrement is false', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={false}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      expect((plusButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('disables decrement button when canDecrement is false', () => {
      render(
        <QuantityStepper
          canDecrement={false}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={2}
        />
      );

      const minusButton = screen.getByLabelText('Decrease quantity');
      expect((minusButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('disables decrement button when value is 0 even if canDecrement is true', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={0}
        />
      );

      // Button should be disabled when value is 0
      const minusButton = screen.getByLabelText('Decrease quantity');
      expect((minusButton as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('Trash icon functionality', () => {
    it('shows trash icon when showTrashIcon is true and value > 0', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={true}
          value={1}
        />
      );

      expect(screen.getByLabelText('Remove ticket')).toBeDefined();
      expect(screen.queryByLabelText('Decrease quantity')).toBeNull();
    });

    it('shows minus icon when showTrashIcon is false', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      expect(screen.getByLabelText('Decrease quantity')).toBeDefined();
      expect(screen.queryByLabelText('Remove ticket')).toBeNull();
    });

    it('calls onDecrement when trash button is clicked', () => {
      const onDecrement = vi.fn();
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={vi.fn()}
          showTrashIcon={true}
          value={1}
        />
      );

      const trashButton = screen.getByLabelText('Remove ticket');
      fireEvent.click(trashButton);
      expect(onDecrement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('applies aria-describedby to increment button when provided', () => {
      render(
        <QuantityStepper
          ariaDescribedById="description-id"
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      expect(plusButton.getAttribute('aria-describedby')).toBe(
        'description-id'
      );
    });

    it('does not apply aria-describedby when not provided', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      expect(plusButton.getAttribute('aria-describedby')).toBeNull();
    });

    it('has correct aria-labels for different states', () => {
      const { rerender } = render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={0}
        />
      );

      // When value is 0, decrement button should be disabled
      const minusButtonWhenZero = screen.getByLabelText('Decrease quantity');
      expect((minusButtonWhenZero as HTMLButtonElement).disabled).toBe(true);
      expect(screen.queryByLabelText('Remove ticket')).toBeNull();

      // When value > 0 and showTrashIcon is false
      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      expect(screen.getByLabelText('Decrease quantity')).toBeDefined();

      // When value > 0 and showTrashIcon is true
      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={true}
          value={1}
        />
      );

      expect(screen.getByLabelText('Remove ticket')).toBeDefined();
    });
  });

  describe('Value display and updates', () => {
    it('displays the correct value', () => {
      const { rerender } = render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={0}
        />
      );

      expect(screen.getByText('0')).toBeDefined();

      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={5}
        />
      );

      expect(screen.getByText('5')).toBeDefined();
    });

    it('handles large values', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={999}
        />
      );

      expect(screen.getByText('999')).toBeDefined();
    });

    it('handles negative values', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={-1}
        />
      );

      expect(screen.getByText('-1')).toBeDefined();
      // Negative values should still show controls
      expect(screen.getByLabelText('Decrease quantity')).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('handles rapid value changes', () => {
      const onIncrement = vi.fn();
      const onDecrement = vi.fn();

      const { rerender } = render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          showTrashIcon={false}
          value={0}
        />
      );

      // Rapidly change values
      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          showTrashIcon={false}
          value={1}
        />
      );

      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          showTrashIcon={false}
          value={2}
        />
      );

      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          showTrashIcon={false}
          value={0}
        />
      );

      expect(screen.getByText('0')).toBeDefined();
    });

    it('handles both buttons disabled', () => {
      render(
        <QuantityStepper
          canDecrement={false}
          canIncrement={false}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      const minusButton = screen.getByLabelText('Decrease quantity');

      expect((plusButton as HTMLButtonElement).disabled).toBe(true);
      expect((minusButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('handles undefined ariaDescribedById', () => {
      render(
        <QuantityStepper
          ariaDescribedById={undefined}
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      const plusButton = screen.getByLabelText('Increase quantity');
      expect(plusButton.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('Animation states', () => {
    it('renders with initial animation state', () => {
      render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      // Component should render successfully with animation classes
      const container = screen.getByText('1').closest('div');
      expect(container).toBeDefined();
      expect(container?.className).toContain('inline-flex');
    });

    it('handles value changes that trigger bump animation', () => {
      const { rerender } = render(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={1}
        />
      );

      // Change value to trigger bump animation
      rerender(
        <QuantityStepper
          canDecrement={true}
          canIncrement={true}
          onDecrement={vi.fn()}
          onIncrement={vi.fn()}
          showTrashIcon={false}
          value={2}
        />
      );

      expect(screen.getByText('2')).toBeDefined();
    });
  });
});
