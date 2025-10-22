import * as z from "zod";

export const ticketFiltersSchema = z.object({
	id: z.string(), // Always 'main' (singleton pattern)

	// Visibility filters
	showSoldOut: z.boolean().default(false),
	showScheduled: z.boolean().default(false),

	// Category/type filter (null = show all, for 30+ ticket types)
	categoryFilter: z.string().nullable().default(null),

	// Price range filter (amounts in cents)
	priceRange: z
		.object({
			min: z.number().int().nonnegative().nullable().default(null),
			max: z.number().int().nonnegative().nullable().default(null),
		})
		.default({ min: null, max: null }),

	// Text search
	searchQuery: z.string().default(""),

	// Sort preference
	sortBy: z
		.enum(["sortOrder", "price", "name", "availability"])
		.default("sortOrder"),
	sortDirection: z.enum(["asc", "desc"]).default("asc"),

	// Pagination (for future use)
	page: z.number().int().positive().default(1),
	pageSize: z.number().int().positive().default(50),
});

export type TicketFilters = z.output<typeof ticketFiltersSchema>;
export type TicketFiltersInput = z.input<typeof ticketFiltersSchema>;
