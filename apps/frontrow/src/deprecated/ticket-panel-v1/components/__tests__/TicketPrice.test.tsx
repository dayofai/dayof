// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calculateBreakdownAmounts, TicketPrice } from "../TicketPrice";

describe("TicketPrice", () => {
	it("returns formatted ticket price string", () => {
		const pricing = {
			ticket: { amount: 2500, currency: "USD" },
		};

		const result = TicketPrice({ pricing });
		expect(result).toBe("$25.00");
	});

	it("returns formatted price regardless of strike price", () => {
		const pricing = {
			ticket: { amount: 2000, currency: "USD" },
			strikePrice: { amount: 3000, currency: "USD" },
		};

		const result = TicketPrice({ pricing });
		expect(result).toBe("$20.00");
	});

	it("calculates fee and tax breakdown amounts", () => {
		const pricing = {
			ticket: { amount: 5000, currency: "USD" },
			fees: {
				amount: { amount: 500, currency: "USD" },
				included: false,
				showBreakdown: true,
				label: "Service Fee",
			},
			tax: {
				amount: { amount: 400, currency: "USD" },
				included: false,
				showBreakdown: true,
				label: "Tax",
			},
		};

		const { feesAmount, taxAmount } = calculateBreakdownAmounts(pricing);

		expect(feesAmount).toBeDefined();
		expect(taxAmount).toBeDefined();
		expect(feesAmount?.toJSON().amount).toBe(500);
		expect(taxAmount?.toJSON().amount).toBe(400);
	});

	it("returns null for fees/tax when not present", () => {
		const pricing = {
			ticket: { amount: 5000, currency: "USD" },
		};

		const { feesAmount, taxAmount } = calculateBreakdownAmounts(pricing);

		expect(feesAmount).toBeNull();
		expect(taxAmount).toBeNull();
	});
});
