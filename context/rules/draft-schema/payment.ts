import { sql } from "drizzle-orm";
import { pgTable, check, unique, pgEnum } from "drizzle-orm/pg-core";
import { timeStamps } from "./extend-timestamps";
import { createdBy } from "./extend-created-by";
import { dineroType } from "./custom-types";
import { cart } from "./cart";
import { order } from "./order";
import { currency } from "./currency";
import { customer } from "./customer";
import { region } from "./region";

export const paymentCollectionStatusEnum = pgEnum(
	"payment_collection_status_enum",
	[
		"awaiting_payment", // initial state
		"partially_paid", // some payments received
		"paid", // fully paid
		"canceled", // collection canceled
		"failed", // payment attempts failed
		"requires_action", // customer action needed
	],
);

export const paymentIntentStatusEnum = pgEnum("payment_intent_status_enum", [
	"requires_payment_method", // initial state - no payment method provided
	"requires_confirmation", // payment method attached, ready for confirmation
	"requires_action", // additional action needed (e.g., 3ds)
	"processing", // payment is being processed
	"succeeded", // payment successful
	"canceled", // payment canceled
	"failed", // payment failed
]);

export const paymentIntentTypeEnum = pgEnum("payment_intent_type_enum", [
	"one_time",
	"deposit",
	"installment",
]);

export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status_enum", [
	"pending", // initial state when attempt is created
	"processing", // payment is being processed
	"requires_action", // needs customer action (3ds, etc)
	"succeeded", // payment succeeded
	"failed", // payment failed
	"canceled", // payment was canceled
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type_enum", [
	"card",
	"us_bank_account",
	"link",
	"apple_pay",
	"google_pay",
	"paypal",
	"cashapp",
	"affirm",
	"klarna",
	"afterpay_clearpay",
	"gift_card",
	"merchant_credit",
]);

export const refundStatusEnum = pgEnum("refund_status_enum", [
	"pending", // initial state
	"processing", // being processed by provider
	"succeeded", // successfully refunded
	"failed", // refund failed
	"canceled", // refund was canceled
]);

export const invoiceStatusEnum = pgEnum("invoice_status_enum", [
	"draft", // created but not finalized
	"open", // finalized and awaiting payment
	"paid", // fully paid
	"void", // canceled/voided
	"uncollectible", // failed to collect and marked as bad debt
]);

// @jonpage0: I assume this ia  meta payment provider, e.g. Stripe, etc. Does each of our customers have a payment provider? Or are these same for all? If everyone has one created by user id etc. might be useful.
// Stripe, HyperSwitch, gift cards, merchant accounts, etc.
export const paymentProvider = pgTable(
	"payment_provider",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'payp_' || nanoid()`),
		name: t.text("name").notNull(),

		isEnabled: t.boolean("is_enabled").default(true).notNull(),
		isTest: t.boolean("is_test").default(false).notNull(),
		// isSubscription?

		config: t.jsonb("config"),
		metadata: t.jsonb("metadata"),

		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		unique("payment_provider_name_unique").on(table.name),
		check(
			"payment_provider_id_check",
			sql`${table.id} SIMILAR TO 'payp_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const paymentCollection = pgTable(
	"payment_collection",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'payc_' || nanoid()`),

		// Business relationship (mutually exclusive)
		cartId: t.text("cart_id").references(() => cart.id),
		orderId: t.text("order_id").references(() => order.id),

		// Amount tracking
		totalAmount: dineroType().notNull(),
		authorizedAmount: dineroType("authorized_amount"),
		capturedAmount: dineroType("captured_amount"),
		refundedAmount: dineroType("refunded_amount"),

		regionId: t
			.text("region_id")
			.references(() => region.id)
			.notNull(),
		currencyCode: t
			.text("currency_code")
			.references(() => currency.code)
			.notNull(),

		// Status
		status: paymentCollectionStatusEnum("status")
			.default("awaiting_payment")
			.notNull(),

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"payment_collection_id_check",
			sql`${table.id} SIMILAR TO 'payc_[0-9a-zA-Z]{12}'`,
		),
		check(
			"payment_collection_cart_or_order_check",
			sql`${table.cartId} IS NOT NULL OR ${table.orderId} IS NOT NULL`,
		),
	],
);

export const paymentIntent = pgTable(
	"payment_intent",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'payi_' || nanoid()`),

		// Add checkout session ID
		providerCheckoutSessionId: t.text("provider_checkout_session_id"), // Stripe Checkout Session ID, null if no Checkout Session

		paymentCollectionId: t
			.text("payment_collection_id")
			.references(() => paymentCollection.id)
			.notNull(),
		subscriptionId: t.text("subscription_id").references(() => subscription.id),
		invoiceId: t.text("invoice_id").references(() => invoice.id),
		paymentProviderId: t
			.text("payment_provider_id")
			.references(() => paymentProvider.id)
			.notNull(),

		amount: dineroType().notNull(),

		type: paymentIntentTypeEnum("type").notNull(),

		status: paymentIntentStatusEnum("status")
			.default("requires_payment_method")
			.notNull(),

		providerPaymentIntentId: t.text("provider_payment_intent_id"), // Stripe charge ID or HyperSwitch payment ID
		data: t.jsonb("data"), // full provider response

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"payment_intent_id_check",
			sql`${table.id} SIMILAR TO 'payi_[0-9a-zA-Z]{12}'`,
		),
	],
);

// represents a single attempt to capture a payment
// we do not update attempts, they are immutable
export const paymentAttempt = pgTable(
	"payment_attempt",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'paya_' || nanoid()`),

		paymentIntentId: t
			.text("payment_intent_id")
			.references(() => paymentIntent.id)
			.notNull(),

		amount: dineroType().notNull(),
		status: paymentAttemptStatusEnum("status").default("pending").notNull(),

		// provider specific
		providerTransactionId: t.text("provider_transaction_id"), // Stripe charge ID or HyperSwitch payment ID
		data: t.jsonb("data"), // full provider response

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"payment_attempt_id_check",
			sql`${table.id} SIMILAR TO 'paya_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const paymentMethod = pgTable(
	"payment_method",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'paym_' || nanoid()`),

		// Relationships
		paymentProviderId: t
			.text("payment_provider_id")
			.references(() => paymentProvider.id)
			.notNull(),
		customerId: t
			.text("customer_id")
			.references(() => customer.id)
			.notNull(),

		// provider specific
		providerCustomerId: t.text("provider_customer_id").notNull(), // Stripe/HyperSwitch customer ID
		providerPaymentMethodId: t.text("provider_payment_method_id").notNull(), // Stripe/HyperSwitch PM ID
		data: t.jsonb("data"), // full provider payment method object

		// Payment method details
		type: paymentMethodTypeEnum("type").notNull(),
		isDefault: t.boolean("is_default").default(false),

		// Display info
		label: t.text("label").notNull(), // e.g., "Visa ending in 4242"

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"payment_method_id_check",
			sql`${table.id} SIMILAR TO 'paym_[0-9a-zA-Z]{12}'`,
		),
		// ensure uniqueness of provider payment method
		unique("payment_method_provider_unique").on(
			table.providerPaymentMethodId,
			table.providerCustomerId,
		),
	],
);

export const refundReason = pgTable(
	"refund_reason",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'payrr_' || nanoid()`),
		label: t.text("label").notNull(),
		description: t.text("description"),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		unique("refund_reason_label_unique").on(table.label),
		check(
			"refund_reason_pk_check",
			sql`${table.id} SIMILAR TO 'payrr_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const refund = pgTable(
	"refund",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'payr_' || nanoid()`),

		// relationships
		paymentIntentId: t
			.text("payment_intent_id")
			.references(() => paymentIntent.id)
			.notNull(),
		installmentId: t.text("installment_id").references(() => installment.id), // optional - for linking to specific installment
		invoiceId: t.text("invoice_id").references(() => invoice.id), // optional - for linking to specific invoice

		// destination provider & details
		destinationProviderId: t
			.text("destination_provider_id")
			.references(() => paymentProvider.id)
			.notNull(), // could be Stripe, gift card provider, a merchant account, etc.
		destinationPaymentMethodId: t
			.text("destination_payment_method_id")
			.references(() => paymentMethod.id), // optional - if null, refund to source payment method

		refundReasonId: t
			.text("refund_reason_id")
			.references(() => refundReason.id),

		// refund details
		amount: dineroType().notNull(),
		note: t.text("note"), // additional context beyond standard reason
		status: refundStatusEnum("status").default("pending").notNull(),

		// provider specifics
		providerRefundId: t.text("provider_refund_id"), // Stripe refund ID or HyperSwitch refund ID
		data: t.jsonb("data"), // full provider refund object

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"refund_pk_check",
			sql`${table.id} SIMILAR TO 'payr_[0-9a-zA-Z]{12}'`,
		),
	],
);

// need to check this against our actual current invoice data for subscriptions!
export const invoice = pgTable(
	"invoice",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'inv_' || nanoid()`),

		// Relationships
		subscriptionId: t
			.text("subscription_id")
			.references(() => subscription.id)
			.notNull(),

		// Invoice details
		amount: dineroType().notNull(),
		status: invoiceStatusEnum("status").default("draft").notNull(),

		// Billing period
		periodStart: t.timestamp("period_start", { withTimezone: true }).notNull(),
		periodEnd: t.timestamp("period_end", { withTimezone: true }).notNull(),
		dueDate: t.timestamp("due_date", { withTimezone: true }).notNull(),

		// Provider specific
		providerInvoiceId: t.text("provider_invoice_id"), // e.g., Stripe invoice ID
		data: t.jsonb("data"),

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"invoice_id_check",
			sql`${table.id} SIMILAR TO 'inv_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const subscriptionTypeEnum = pgEnum("subscription_type_enum", [
	"recurring", // continues until canceled
	"installment", // fixed number of payments
]);

export const subscriptionStatusEnum = pgEnum("subscription_status_enum", [
	"active", // subscription is active and billing
	"canceled", // subscription has been canceled
	"completed", // all installments paid (for installment type)
	"past_due", // payment(s) have failed
	"unpaid", // failed to collect payment
]);

export const billingIntervalEnum = pgEnum("billing_interval_enum", [
	"day",
	"week",
	"month",
	"year",
]);

export const subscriptionPhaseTypeEnum = pgEnum(
	"subscription_phase_type_enum",
	[
		"bridge", // zero-cost bridge phase until first payment
		"installment", // regular payment phase
	],
);

export const subscriptionPhaseStatusEnum = pgEnum(
	"subscription_phase_status_enum",
	[
		"scheduled", // future phase
		"active", // current phase
		"completed", // past phase
		"canceled", // phase was canceled
	],
);

export const subscriptionSchedulePhaseTypeEnum = pgEnum(
	"subscription_schedule_phase_type_enum",
	[
		"bridge", // Zero-cost bridge phase until first payment
		"installment", // Regular payment phase
	],
);

export const subscriptionSchedulePhaseStatusEnum = pgEnum(
	"subscription_schedule_phase_status_enum",
	[
		"scheduled", // Future phase
		"active", // Current phase
		"completed", // Past phase
		"canceled", // Phase was canceled
	],
);

export const installmentStatusEnum = pgEnum("installment_status_enum", [
	"scheduled", // future installment
	"active", // current installment
	"completed", // past installment
	"canceled", // installment was canceled
]);

// definitely missing something here
// need to look at how we've done it and make any adjustments necessary

export const subscription = pgTable(
	"subscription",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'sub_' || nanoid()`),
		paymentCollectionId: t
			.text("payment_collection_id")
			.references(() => paymentCollection.id)
			.notNull(),

		// subscription details
		type: subscriptionTypeEnum("type").notNull(),
		status: subscriptionStatusEnum("status").default("active").notNull(),

		// overall subscription timing
		startDate: t.timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: t.timestamp("end_date", { withTimezone: true }), // null for recurring
		canceledAt: t.timestamp("canceled_at", { withTimezone: true }),

		hasDeposit: t.boolean("has_deposit").default(true),
		depositPaymentIntentId: t.text("deposit_payment_intent_id"),
		// installmentAmount: dineroType(), // null if a schedule

		paymentProviderId: t
			.text("payment_provider_id")
			.references(() => paymentProvider.id)
			.notNull(),
		providerSubscriptionId: t.text("provider_subscription_id"),
		providerScheduleId: t.text("provider_schedule_id"), // Stripe subscription schedule ID
		data: t.jsonb("data"),

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"subscription_id_check",
			sql`${table.id} SIMILAR TO 'sub_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const subscriptionSchedulePhase = pgTable(
	"subscription_schedule_phase",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'subp_' || nanoid()`),

		subscriptionId: t
			.text("subscription_id")
			.references(() => subscription.id)
			.notNull(),

		// phase details
		type: subscriptionSchedulePhaseTypeEnum("type").notNull(),
		status: subscriptionSchedulePhaseStatusEnum("status")
			.default("scheduled")
			.notNull(),
		phaseIndex: t.integer("phase_index").notNull(), // 0 for bridge, 1 for installments

		startDate: t.timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: t.timestamp("end_date", { withTimezone: true }), // null for indefinite

		// billing details (null for bridge phase)
		amount: dineroType(),
		interval: billingIntervalEnum("interval"),
		intervalCount: t.integer("interval_count"),

		providerPhaseId: t.text("provider_phase_id"), // Stripe schedule phase ID
		data: t.jsonb("data"),

		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const installment = pgTable("installment", (t) => ({
	id: t.text("id").primaryKey().default(sql`'inst_' || nanoid()`),

	subscriptionId: t
		.text("subscription_id")
		.references(() => subscription.id)
		.notNull(),
	phaseId: t
		.text("phase_id")
		.references(() => subscriptionSchedulePhase.id)
		.notNull(),
	invoiceId: t.text("invoice_id").references(() => invoice.id), // null until invoice created

	amount: dineroType().notNull(),
	installmentNumber: t.integer("installment_number").notNull(),
	billingDate: t.timestamp("billing_date", { withTimezone: true }).notNull(),
	status: installmentStatusEnum("status").default("scheduled").notNull(),

	refundedAmount: dineroType("refunded_amount"),

	metadata: t.jsonb("metadata"),
	...timeStamps({ softDelete: true }),
	...createdBy(),
}));
