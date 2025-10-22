import { useAtomValue, useSetAtom } from "jotai";
import { Info } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { incrementTicketAtom } from "@/lib/atoms/cart";
import { eventConfigAtom } from "@/lib/atoms/ticket-ui-states";
import type { Ticket } from "@/lib/schemas/tickets";
import { cn } from "@/lib/utils";
import { getUserLocale } from "@/lib/utils/format";
import { FeaturedBadge } from "./FeaturedBadge.tsx";
import { QuantityStepper } from "./QuantityStepper";
import { calculateBreakdownAmounts, TicketPrice } from "./TicketPrice";
import type { TicketUIState } from "./TicketsPanel";

interface TicketCardProps {
	ticket: Ticket;
	uiState: TicketUIState;
	// No handlers - uses atoms directly!
}

/**
 * TicketContentLayout - Pure presentation component for ticket information
 * Reusable across different interaction modes (button, div, radio, etc.)
 */
interface TicketContentLayoutProps {
	ticket: Ticket;
	uiState: TicketUIState;
}

function TicketContentLayout({ ticket, uiState }: TicketContentLayoutProps) {
	const eventConfig = useAtomValue(eventConfigAtom);
	return (
		<div className="flex-1 min-w-0">
			{/* Title + Badges Row */}
			<div className="flex items-center flex-wrap flex-1 gap-2">
				<span className="font-medium text-base text-[var(--dayof-dark)]">
					{ticket.name}
				</span>
				{uiState.helperText && (
					<Badge variant="secondary" className="text-xs">
						{uiState.helperText}
					</Badge>
				)}
				{ticket.featured && (
					<Badge variant="primary" className="text-xs">
						Best Value
					</Badge>
				)}
			</div>

			{/* Price with Tooltip */}
			<div className="flex items-center gap-1 mt-0.5">
				<span className="font-medium text-base text-[var(--dayof-dark)] tabular-nums">
					<TicketPrice
						pricing={ticket.pricing}
						currency={eventConfig?.currency}
						locale={eventConfig?.locale ?? getUserLocale()}
					/>
				</span>
				{(ticket.pricing.fees?.showBreakdown ||
					ticket.pricing.tax?.showBreakdown) && (
					<Tooltip>
						<TooltipTrigger
							render={(props) => (
								<span
									{...props}
									role="button"
									tabIndex={0}
									className="text-[var(--dayof-muted)] hover:text-[var(--dayof-dark)] transition-colors inline-flex cursor-pointer"
									onClick={(e) => {
										props.onClick?.(e);
										e.stopPropagation();
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											props.onClick?.(e as any);
											e.stopPropagation();
										}
									}}
									aria-label="Show fee and tax breakdown"
								>
									<Info className="h-3.5 w-3.5" />
								</span>
							)}
						/>
						<TooltipContent variant="light" className="min-w-[180px]">
							{(() => {
								const { feesAmount, taxAmount } = calculateBreakdownAmounts(
									ticket.pricing,
								);
								return (
									<div className="space-y-1">
										{ticket.pricing.fees?.showBreakdown && feesAmount && (
											<div className="flex justify-between gap-4 text-xs">
												<span className="text-[var(--dayof-muted)]">
													{ticket.pricing.fees.label ?? "Fees"}
												</span>
												<span className="font-medium text-[var(--dayof-dark)]">
													{new Intl.NumberFormat(
														eventConfig?.locale ?? getUserLocale(),
														{
															style: "currency",
															currency:
																eventConfig?.currency ?? feesAmount.currency,
														},
													).format(feesAmount.amount / 100)}
												</span>
											</div>
										)}
										{ticket.pricing.tax?.showBreakdown && taxAmount && (
											<div className="flex justify-between gap-4 text-xs">
												<span className="text-[var(--dayof-muted)]">
													{ticket.pricing.tax.label ?? "Tax"}
												</span>
												<span className="font-medium text-[var(--dayof-dark)]">
													{new Intl.NumberFormat(
														eventConfig?.locale ?? getUserLocale(),
														{
															style: "currency",
															currency:
																eventConfig?.currency ?? taxAmount.currency,
														},
													).format(taxAmount.amount / 100)}
												</span>
											</div>
										)}
									</div>
								);
							})()}
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Description */}
			{ticket.description && (
				<p className="text-[13px] leading-[19.5px] mt-0.5 text-[var(--dayof-muted)] text-left">
					{ticket.description}
				</p>
			)}

			{/* Availability Status */}
			{ticket.availabilityLabel && (
				<div className="flex items-center gap-1.5 text-[13px] mt-1 text-[var(--dayof-muted)]">
					<span
						className={cn(
							"w-2.5 h-2.5 rounded-full",
							uiState.isPurchasable
								? "bg-green-500"
								: "bg-[var(--theme-accent-32)]",
						)}
					/>
					<span>{ticket.availabilityLabel}</span>
				</div>
			)}

			{/* Unavailable reason - always visible when present */}
			{uiState.unavailableReason && (
				<div className="mt-2 inline-flex items-center gap-1.5 rounded bg-[var(--theme-accent-08)] px-2 py-1 text-xs text-[var(--dayof-muted)]">
					<Info aria-hidden="true" className="h-3.5 w-3.5" />
					{uiState.unavailableReason}
				</div>
			)}
		</div>
	);
}

/**
 * TicketCard - Main component using Card-as-container pattern
 * Card stays semantic (always a div), content inside adapts to interaction mode
 */
export function TicketCard({ ticket, uiState }: TicketCardProps) {
	// Access atoms directly - no prop drilling!
	const increment = useSetAtom(incrementTicketAtom);

	// Click handler for add-to-cart action (only when qty=0)
	const handleAddClick = () => {
		if (!uiState.isPurchasable) {
			return;
		}
		increment(ticket.id);
	};

	// Card visual styles (Luma light theme: white cards with subtle borders)
	const cardClasses = cn(
		"rounded-lg transition-all duration-200",
		"bg-white border",
		// Unselected purchasable: subtle border that darkens on hover
		uiState.isPurchasable &&
			!uiState.isSelected &&
			"border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.16)]",
		// Selected: black border (matching Luma)
		uiState.isSelected && "border-black shadow-sm",
		// Disabled: reduced opacity with subtle border
		!uiState.isPurchasable && "opacity-50 border-[rgba(0,0,0,0.08)]",
	);

	return (
		<Card className={cardClasses}>
			{/* Interactive mode: button when qty=0 (click to add) */}
			{uiState.currentQty === 0 && uiState.isPurchasable ? (
				<button
					type="button"
					disabled={!uiState.isPurchasable}
					onClick={handleAddClick}
					className={cn(
						"w-full text-left p-3",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2",
						uiState.isPurchasable ? "cursor-pointer" : "cursor-not-allowed",
					)}
				>
					{ticket.featured && uiState.currentQty === 0 ? (
						<FeaturedBadge />
					) : null}
					<TicketContentLayout ticket={ticket} uiState={uiState} />
				</button>
			) : (
				/* Display mode: div container with optional stepper */
				<div className="p-3">
					<div className="flex items-start gap-2.5">
						<TicketContentLayout ticket={ticket} uiState={uiState} />

						{/* Stepper appears on the right when qty > 0 */}
						{uiState.currentQty > 0 && (
							<div className="flex items-start pt-0.5">
								<QuantityStepper ticketId={ticket.id} />
							</div>
						)}
					</div>
				</div>
			)}
		</Card>
	);
}
