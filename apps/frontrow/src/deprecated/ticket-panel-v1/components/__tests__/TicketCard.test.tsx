// @vitest-environment jsdom
// biome-ignore lint/correctness/noUnusedImports: test file
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Ticket } from "@/lib/schemas/tickets";
import { TicketCard } from "../TicketCard";
import type { TicketUIState } from "../TicketsPanel";

// Mock the QuantityStepper component
vi.mock("../QuantityStepper", () => ({
	QuantityStepper: ({
		value,
		onIncrement,
		onDecrement,
		ariaDescribedById,
	}: any) => (
		<div data-testid="quantity-stepper">
			<button
				aria-describedby={ariaDescribedById}
				data-testid="increment-btn"
				onClick={onIncrement}
				type="button"
			>
				+
			</button>
			<span data-testid="quantity-value">{value}</span>
			<button data-testid="decrement-btn" type="button" onClick={onDecrement}>
				-
			</button>
		</div>
	),
}));

// Mock the TicketPrice component
vi.mock("../TicketPrice", () => ({
	TicketPrice: ({ pricing }: any) => (
		<div data-testid="ticket-price">Price: {pricing?.basePrice || "Free"}</div>
	),
}));

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
	id: "test-ticket",
	name: "Test Ticket",
	description: "A test ticket description",
	pricing: {
		ticket: {
			amount: 1000,
			currency: "USD",
		},
	},
	availabilityLabel: "Available",
	featured: false,
	status: "on_sale",
	soldLimit: "unlimited",
	...overrides,
});

const createMockUIState = (
	overrides: Partial<TicketUIState> = {},
): TicketUIState => ({
	isPurchasable: true,
	isGreyedOut: false,
	canIncrement: true,
	canDecrement: true,
	currentQty: 0,
	showTrashIcon: false,
	helperText: null,
	unavailableReason: null,
	ticketId: "test-ticket",
	isLocked: false,
	isSelected: false, // Default: not selected
	...overrides,
});

describe("TicketCard", () => {
	describe("Basic rendering", () => {
		it("renders ticket name and description", () => {
			const ticket = createMockTicket({
				name: "VIP Pass",
				description: "Premium access ticket",
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByText("VIP Pass")).toBeDefined();
			expect(screen.getByText("Premium access ticket")).toBeDefined();
		});

		it("renders ticket price", () => {
			const ticket = createMockTicket({
				pricing: { ticket: { amount: 2500, currency: "USD" } },
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByTestId("ticket-price")).toBeDefined();
		});

		it("renders availability label with status dot", () => {
			const ticket = createMockTicket({
				availabilityLabel: "Limited availability",
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByText("Limited availability")).toBeDefined();
		});

		it("does not render description when not provided", () => {
			const ticket = createMockTicket({
				description: undefined,
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.queryByText(/description/i)).toBeNull();
		});

		it("does not render availability label when not provided", () => {
			const ticket = createMockTicket({
				availabilityLabel: undefined,
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.queryByText(/available/i)).toBeNull();
		});
	});
	describe("UI state interactions", () => {
		it("renders quantity stepper when ticket is purchasable", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				currentQty: 2,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByTestId("quantity-stepper")).toBeDefined();
		});

		it("does not render quantity stepper when ticket is not purchasable", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: false,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.queryByTestId("quantity-stepper")).toBeNull();
		});

		it("renders helper text badge when provided", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				helperText: "Min 4 required",
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByText("Min 4 required")).toBeDefined();
		});

		it("does not render helper text badge when not provided", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				helperText: undefined,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.queryByText(/Min 4 required/)).toBeNull();
		});
	});

	describe("Event handlers", () => {
		it("calls onIncrement when card is clicked (qty=0)", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				canIncrement: true,
				currentQty: 0, // No stepper visible, card is clickable
			});
			const onIncrement = vi.fn();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={onIncrement}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			// When qty=0, the whole card is the button
			const cardButton = screen.getByRole("button");
			fireEvent.click(cardButton);
			expect(onIncrement).toHaveBeenCalledWith("test-ticket");
		});

		it("calls onIncrement when increment button is clicked (qty>0)", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				canIncrement: true,
				currentQty: 2, // Stepper visible
			});
			const onIncrement = vi.fn();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={onIncrement}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			// When qty>0, stepper has the increment button
			const incrementBtn = screen.getByTestId("increment-btn");
			fireEvent.click(incrementBtn);
			expect(onIncrement).toHaveBeenCalledWith("test-ticket");
		});

		it("calls onDecrement when decrement button is clicked", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				canDecrement: true,
				currentQty: 1,
			});
			const onDecrement = vi.fn();

			render(
				<TicketCard
					onDecrement={onDecrement}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			const decrementBtn = screen.getByTestId("decrement-btn");
			fireEvent.click(decrementBtn);
			expect(onDecrement).toHaveBeenCalledWith("test-ticket");
		});
	});

	describe("Edge cases", () => {
		it("handles ticket with minimal data", () => {
			const ticket = createMockTicket({
				description: undefined,
				availabilityLabel: undefined,
				featured: false,
			});
			const uiState = createMockUIState({
				isPurchasable: false,
				helperText: undefined,
				unavailableReason: undefined,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByText("Test Ticket")).toBeDefined();
			expect(screen.queryByTestId("quantity-stepper")).toBeNull();
		});

		it("handles ticket with all optional fields", () => {
			const ticket = createMockTicket({
				description: "Full description",
				availabilityLabel: "Available now",
				featured: true,
			});
			const uiState = createMockUIState({
				isPurchasable: true,
				helperText: "Special offer",
				unavailableReason: "Limited time",
				currentQty: 3,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.getByText("Test Ticket")).toBeDefined();
			expect(screen.getByText("Full description")).toBeDefined();
			expect(screen.getByText("Available now")).toBeDefined();
			expect(screen.getByText("Special offer")).toBeDefined();
			expect(screen.getByTestId("quantity-stepper")).toBeDefined();
		});

		it("handles rapid state changes", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				currentQty: 0,
			});

			const { rerender } = render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			// Rapidly change the UI state
			rerender(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={{ ...uiState, currentQty: 1 }}
				/>,
			);

			rerender(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={{ ...uiState, currentQty: 0, isPurchasable: false }}
				/>,
			);

			expect(screen.getByText("Test Ticket")).toBeDefined();
		});

		it("handles empty ticket name", () => {
			const ticket = createMockTicket({
				name: "",
			});
			const uiState = createMockUIState();

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			// Should still render the component without crashing
			expect(screen.getByTestId("ticket-price")).toBeDefined();
		});
	});

	describe("Quantity stepper integration", () => {
		it("passes correct props to QuantityStepper", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: true,
				canIncrement: true,
				canDecrement: false,
				currentQty: 2,
				showTrashIcon: true,
				helperText: "Helper text",
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			const stepper = screen.getByTestId("quantity-stepper");
			expect(stepper).toBeDefined();
			const quantityValue = screen.getByTestId("quantity-value");
			expect(quantityValue.textContent).toBe("2");
		});

		it("does not render QuantityStepper when not purchasable", () => {
			const ticket = createMockTicket();
			const uiState = createMockUIState({
				isPurchasable: false,
			});

			render(
				<TicketCard
					onDecrement={vi.fn()}
					onIncrement={vi.fn()}
					ticket={ticket}
					uiState={uiState}
				/>,
			);

			expect(screen.queryByTestId("quantity-stepper")).toBeNull();
		});
	});
});
