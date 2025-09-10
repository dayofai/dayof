import * as S from '@effect/schema/Schema';
import { type Dinero, dinero, toSnapshot } from 'dinero.js';
import { schema as s } from '../schema/index';

// Custom schema factory for Effect Schema
// Since @handfish/drizzle-effect is incompatible with current Effect Schema version,
// we'll create placeholder implementations for now.
// TODO: Implement proper Effect Schema validation once a compatible library is available

// For now, we'll create placeholder schemas that return Unknown type
// This allows the module to compile while we work on a proper implementation
const createInsertSchema = (_table: unknown) => S.Unknown;
const createSelectSchema = (_table: unknown) => S.Unknown;

// Export helper schemas that can be used independently
export const IdWithPrefix = (prefix: string) =>
  S.String.pipe(S.pattern(new RegExp(`^${prefix}_[0-9A-Za-z]{12}$`)));

export const JsonValue = S.Unknown;

export const IanaTimezone = S.String.pipe(
  S.filter(
    (tz) => {
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: () => 'Invalid IANA timezone',
    }
  )
);

// Dinero type for money handling
const DineroSnapshot = S.Struct({
  amount: S.Number,
  currency: S.optional(
    S.Struct({
      code: S.String,
      base: S.Number,
      exponent: S.Number,
    })
  ),
  scale: S.optional(S.Number),
});

type Snapshot = {
  amount: number;
  currency?: { code: string; base: number; exponent: number };
  scale?: number;
};

export const DineroType = S.transform(
  DineroSnapshot,
  S.Any as unknown as S.Schema<Dinero<number>>,
  {
    decode: (snap: Snapshot) =>
      dinero(
        snap as unknown as {
          amount: number;
          currency: { code: string; base: number; exponent: number };
          scale?: number;
        }
      ),
    encode: (d: Dinero<number>) => toSnapshot(d) as unknown as Snapshot,
  }
);

export const Percentage = S.Number.pipe(
  S.greaterThanOrEqualTo(0),
  S.lessThanOrEqualTo(100)
);

export const NonNegativeInt = S.Number.pipe(S.int(), S.greaterThanOrEqualTo(0));

// Schema exports - all using placeholder Unknown schemas for now
// These will be replaced with proper Effect Schema definitions once we have a compatible library

// Users / Orgs
export const UsersInsert = createInsertSchema(s.users);
export const UsersSelect = createSelectSchema(s.users);

export const OrganizationsInsert = createInsertSchema(s.organizations);
export const OrganizationsSelect = createSelectSchema(s.organizations);

// Currency
export const CurrencyInsert = createInsertSchema(s.currency);
export const CurrencySelect = createSelectSchema(s.currency);

// Region
export const RegionInsert = createInsertSchema(s.region);
export const RegionSelect = createSelectSchema(s.region);

export const RegionCountryInsert = createInsertSchema(s.regionCountry);
export const RegionCountrySelect = createSelectSchema(s.regionCountry);

export const RegionPaymentProviderInsert = createInsertSchema(
  s.regionPaymentProvider
);
export const RegionPaymentProviderSelect = createSelectSchema(
  s.regionPaymentProvider
);

// Location types
export const LocationTypeInsert = createInsertSchema(s.locationType);
export const LocationTypeSelect = createSelectSchema(s.locationType);

// Address
export const AddressInsert = createInsertSchema(s.address);
export const AddressSelect = createSelectSchema(s.address);

// Org settings & brand profile
export const OrganizationSettingsInsert = createInsertSchema(
  s.organizationSettings
);
export const OrganizationSettingsSelect = createSelectSchema(
  s.organizationSettings
);

export const BrandProfileInsert = createInsertSchema(s.brandProfile);
export const BrandProfileSelect = createSelectSchema(s.brandProfile);

// Sales channels & stock locations
export const StockLocationInsert = createInsertSchema(s.stockLocation);
export const StockLocationSelect = createSelectSchema(s.stockLocation);

export const SalesChannelInsert = createInsertSchema(s.salesChannel);
export const SalesChannelSelect = createSelectSchema(s.salesChannel);

export const SalesChannelStockLocationInsert = createInsertSchema(
  s.salesChannelStockLocation
);
export const SalesChannelStockLocationSelect = createSelectSchema(
  s.salesChannelStockLocation
);

// Product catalog
export const ProductTypeInsert = createInsertSchema(s.productType);
export const ProductTypeSelect = createSelectSchema(s.productType);

export const ProductCategoryInsert = createInsertSchema(s.productCategory);
export const ProductCategorySelect = createSelectSchema(s.productCategory);

export const ProductInsert = createInsertSchema(s.product);
export const ProductSelect = createSelectSchema(s.product);

export const ProductVariantInsert = createInsertSchema(s.productVariant);
export const ProductVariantSelect = createSelectSchema(s.productVariant);

export const ProductGroupInsert = createInsertSchema(s.productGroup);
export const ProductGroupSelect = createSelectSchema(s.productGroup);

export const ProductGroupProductInsert = createInsertSchema(
  s.productGroupProduct
);
export const ProductGroupProductSelect = createSelectSchema(
  s.productGroupProduct
);

export const ProductCategoryProductInsert = createInsertSchema(
  s.productCategoryProduct
);
export const ProductCategoryProductSelect = createSelectSchema(
  s.productCategoryProduct
);

export const ProductTagInsert = createInsertSchema(s.productTag);
export const ProductTagSelect = createSelectSchema(s.productTag);

// Pricing
export const PriceSetInsert = createInsertSchema(s.priceSet);
export const PriceSetSelect = createSelectSchema(s.priceSet);

export const PriceInsert = createInsertSchema(s.price);
export const PriceSelect = createSelectSchema(s.price);

export const ProductVariantPriceSetInsert = createInsertSchema(
  s.productVariantPriceSet
);
export const ProductVariantPriceSetSelect = createSelectSchema(
  s.productVariantPriceSet
);

export const ProductSalesChannelInsert = createInsertSchema(
  s.productSalesChannel
);
export const ProductSalesChannelSelect = createSelectSchema(
  s.productSalesChannel
);

// Tax & Fees
export const TaxRateInsert = createInsertSchema(s.taxRate);
export const TaxRateSelect = createSelectSchema(s.taxRate);

export const ProductVariantTaxRateInsert = createInsertSchema(
  s.productVariantTaxRate
);
export const ProductVariantTaxRateSelect = createSelectSchema(
  s.productVariantTaxRate
);

export const FeeInsert = createInsertSchema(s.fee);
export const FeeSelect = createSelectSchema(s.fee);

// Payments
export const PaymentProviderInsert = createInsertSchema(s.paymentProvider);
export const PaymentProviderSelect = createSelectSchema(s.paymentProvider);

export const PaymentCollectionInsert = createInsertSchema(s.paymentCollection);
export const PaymentCollectionSelect = createSelectSchema(s.paymentCollection);

export const PaymentIntentInsert = createInsertSchema(s.paymentIntent);
export const PaymentIntentSelect = createSelectSchema(s.paymentIntent);

export const PaymentAttemptInsert = createInsertSchema(s.paymentAttempt);
export const PaymentAttemptSelect = createSelectSchema(s.paymentAttempt);

export const PaymentMethodInsert = createInsertSchema(s.paymentMethod);
export const PaymentMethodSelect = createSelectSchema(s.paymentMethod);

export const RefundReasonInsert = createInsertSchema(s.refundReason);
export const RefundReasonSelect = createSelectSchema(s.refundReason);

export const RefundInsert = createInsertSchema(s.refund);
export const RefundSelect = createSelectSchema(s.refund);

export const InvoiceInsert = createInsertSchema(s.invoice);
export const InvoiceSelect = createSelectSchema(s.invoice);

export const SubscriptionInsert = createInsertSchema(s.subscription);
export const SubscriptionSelect = createSelectSchema(s.subscription);

export const SubscriptionSchedulePhaseInsert = createInsertSchema(
  s.subscriptionSchedulePhase
);
export const SubscriptionSchedulePhaseSelect = createSelectSchema(
  s.subscriptionSchedulePhase
);

export const InstallmentInsert = createInsertSchema(s.installment);
export const InstallmentSelect = createSelectSchema(s.installment);

// Promotion - Note: promotion table doesn't exist in schema
// export const PromotionInsert = createInsertSchema(s.promotion);
// export const PromotionSelect = createSelectSchema(s.promotion);
