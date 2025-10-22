import { useAtomValue } from "jotai";
import { ticketUIStatesAtom } from "@/lib/atoms/ticket-ui-states";
import { TicketCard } from "./TicketCard";

// NO PROPS - reads from atoms directly!
export function TicketList() {
	// Read directly from atoms - no prop drilling!
	const ticketUIStates = useAtomValue(ticketUIStatesAtom);

	return (
		<div className="space-y-2" data-testid="ticket-list">
			{ticketUIStates.map((uiState) => (
				<TicketCard
					key={uiState.ticketId}
					ticket={uiState.ticket}
					uiState={uiState}
					// No handlers - TicketCard uses atoms directly!
				/>
			))}
		</div>
	);
}
