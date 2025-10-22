import { useAtomValue, useSetAtom } from "jotai";
import { Minus, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { decrementTicketAtom, incrementTicketAtom } from "@/lib/atoms/cart";
import { ticketUIStatesAtom } from "@/lib/atoms/ticket-ui-states";

interface QuantityStepperProps {
	ticketId: string;
}

export function QuantityStepper({ ticketId }: QuantityStepperProps) {
	// Find own state from atoms - completely self-contained!
	const ticketUIStates = useAtomValue(ticketUIStatesAtom);
	const uiState = ticketUIStates.find((s) => s.ticketId === ticketId);

	// Access cart actions directly
	const increment = useSetAtom(incrementTicketAtom);
	const decrement = useSetAtom(decrementTicketAtom);

	// Bail if no state (shouldn't happen)
	if (!uiState) return null;

	const {
		currentQty: value,
		showTrashIcon,
		canIncrement,
		canDecrement,
		helperText,
	} = uiState;

	// Use helperText for aria-describedby
	const ariaDescribedById = helperText ? React.useId() : undefined;
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
				"inline-flex items-center gap-2",
				"motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
				entered
					? "motion-safe:scale-100 motion-safe:opacity-100"
					: "motion-safe:scale-95 motion-safe:opacity-0",
			].join(" ")}
		>
			<button
				aria-hidden={!showControls}
				aria-label={
					showControls && showTrashIcon ? "Remove ticket" : "Decrease quantity"
				}
				className={[
					"flex items-center justify-center overflow-hidden rounded-[4px] transition-colors disabled:cursor-not-allowed",
					"p-1.5 bg-[var(--theme-accent-04)] hover:bg-[var(--theme-accent-08)] text-[var(--theme-accent-64)]",
					"motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
					showControls ? "opacity-100" : "w-0 opacity-0",
				].join(" ")}
				disabled={!(canDecrement && showControls)}
				onClick={() => decrement(ticketId)}
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
					"overflow-hidden text-center font-medium tabular-nums text-[var(--dayof-dark)]",
					"motion-safe:transition-all motion-safe:duration-250",
					"min-w-9 px-2",
					showControls ? "opacity-100" : "w-0 opacity-0",
					showControls && bump
						? "motion-safe:scale-110"
						: "motion-safe:scale-100",
				].join(" ")}
			>
				{value}
			</span>

			<button
				aria-describedby={ariaDescribedById}
				aria-label="Increase quantity"
				className="flex cursor-pointer items-center justify-center rounded-[4px] p-1.5 transition-colors disabled:cursor-not-allowed bg-[var(--theme-accent-04)] hover:bg-[var(--theme-accent-08)] text-[var(--theme-accent-64)]"
				disabled={!canIncrement}
				onClick={() => increment(ticketId)}
				type="button"
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
}
