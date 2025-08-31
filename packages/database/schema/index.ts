// Centralized exports and Drizzle V2 schema object
// Re-export each module for convenience
export * from "./address";
export * from "./better-auth";
export * from "./currency";
export * from "./custom-types";
export * from "./extend-created-by";
export * from "./extend-timestamps";
export * from "./fee";
export * from "./location";
export * from "./organization";
export * from "./payment";
export * from "./pricing";
export * from "./product";
export * from "./promotion";
export * from "./region";
export * from "./sales-channel";
export * from "./tag";
export * from "./tax";

// Build a Drizzle V2-compatible schema object containing tables (and enums)
// Consumers can import { schema } from "@database/schema" and pass it to drizzle()
import { address } from "./address";
import { users, organizations } from "./better-auth";
import { currency } from "./currency";
import { fee } from "./fee";
import { locationType, location } from "./location";
import { organizationSettings, brandProfile } from "./organization";
import {
	paymentProvider,
	paymentCollection,
	paymentIntent,
	paymentAttempt,
	paymentMethod,
	refundReason,
	refund,
	invoice,
	subscription,
	subscriptionSchedulePhase,
	installment,
} from "./payment";
import { priceSet, price } from "./pricing";
import {
	product,
	productVariant,
	productType,
	productGroup,
	productCategory,
	productGroupProduct,
	productCategoryProduct,
	productTag,
	productVariantPriceSet,
	productSalesChannel,
} from "./product";
import { promotion } from "./promotion";
import { region, regionCountry, regionPaymentProvider } from "./region";
// Rule engine schema is intentionally omitted for now while its design is finalized.
import { stockLocation, salesChannel, salesChannelStockLocation } from "./sales-channel";
import { tags } from "./tag";
import { taxRate, productVariantTaxRate } from "./tax";

export const schema = {
	// shared/auth
	users,
	organizations,

	// reference tables
	currency,
	region,
	regionCountry,
	regionPaymentProvider,
	locationType,
	stockLocation,

	// core entities
	address,
	salesChannel,
	salesChannelStockLocation,
	organizationSettings,
	brandProfile,
	productType,
	productCategory,
	product,
	productVariant,
	productGroup,
	productGroupProduct,
	productCategoryProduct,
	productTag,

	// pricing
	priceSet,
	price,
	productVariantPriceSet,
	productSalesChannel,

	// tax & fees
	taxRate,
	productVariantTaxRate,
	fee,

	// payments
	paymentProvider,
	paymentCollection,
	paymentIntent,
	paymentAttempt,
	paymentMethod,
	refundReason,
	refund,
	invoice,
	subscription,
	subscriptionSchedulePhase,
	installment,

    // policy engine (TBD)
} as const;

export type Schema = typeof schema;


