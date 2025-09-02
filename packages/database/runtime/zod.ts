import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';
import { schema as s } from '../schema';

// Helpers
export const idWithPrefix = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[0-9A-Za-z]{12}$`));

export const jsonValue: z.ZodType<unknown> = z.any();

export const ianaTimezone = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}, 'Invalid IANA timezone');

// Generic Dinero snapshot for money and rates
export const dineroSnapshot = z.object({
  amount: z.number().int(),
  currency: z
    .object({
      code: z.string().length(3),
      base: z.number().int(),
      exponent: z.number().int(),
    })
    .optional(),
  scale: z.number().int().optional(),
});

const Percentage = z.coerce.number().min(0).max(100);
const NonNegativeInt = z.coerce.number().int().min(0);

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
    coerce: { date: true },
  });

// Cross-field refinements
type FeeShape = {
  feeType?: 'percentage' | 'fixed';
  percentage?: number | null;
  amount?: unknown | null;
};
const refineFee = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.superRefine((val: unknown, ctx) => {
    const v = val as FeeShape;
    const addIssue = (path: 'percentage' | 'amount', message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    const rules: Record<'percentage' | 'fixed', () => void> = {
      percentage: () => {
        if (v.percentage == null) {
          addIssue('percentage', 'required for percentage type');
        }
        if (v.amount != null) {
          addIssue('amount', 'must be null for percentage type');
        }
      },
      fixed: () => {
        if (v.amount == null) {
          addIssue('amount', 'required for fixed type');
        }
        if (v.percentage != null) {
          addIssue('percentage', 'must be null for fixed type');
        }
      },
    };
    if (!v.feeType) {
      return;
    }
    const fn = rules[v.feeType];
    if (fn) {
      fn();
    }
  });

const refineCartOrOrder = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.superRefine((val: unknown, ctx) => {
    const rec = val as Record<string, unknown>;
    const hasEither = rec.cartId != null || rec.orderId != null;
    if (hasEither) {
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cartId'],
      message: 'Either cartId or orderId must be provided.',
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['orderId'],
      message: 'Either cartId or orderId must be provided.',
    });
  });

type PhaseShape = {
  type?: 'bridge' | 'installment';
  amount?: unknown | null;
  interval?: unknown | null;
  intervalCount?: unknown | null;
};
const refineSchedulePhase = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.superRefine((val: unknown, ctx) => {
    const v = val as PhaseShape;
    const add = (
      path: 'amount' | 'interval' | 'intervalCount',
      message: string
    ) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    const rules: Record<'bridge' | 'installment', () => void> = {
      bridge: () => {
        if (v.amount != null) {
          add('amount', 'amount must be null for bridge phase');
        }
        if (v.interval != null) {
          add('interval', 'interval must be null for bridge phase');
        }
        if (v.intervalCount != null) {
          add('intervalCount', 'intervalCount must be null for bridge phase');
        }
      },
      installment: () => {
        if (v.amount == null) {
          add('amount', 'amount is required for installment phase');
        }
        if (v.interval == null) {
          add('interval', 'interval is required for installment phase');
        }
        if (v.intervalCount == null) {
          add(
            'intervalCount',
            'intervalCount is required for installment phase'
          );
        }
      },
    };
    if (v.type && v.type in rules) {
      rules[v.type]();
    }
  });

// Users / Orgs
export const UsersInsert = createInsertSchema(s.users);
export const UsersSelect = createSelectSchema(s.users);
export const UsersUpdate = createUpdateSchema(s.users);

export const OrganizationsInsert = createInsertSchema(s.organizations);
export const OrganizationsSelect = createSelectSchema(s.organizations);
export const OrganizationsUpdate = createUpdateSchema(s.organizations);

// Currency
export const CurrencyInsert = createInsertSchema(s.currency, {
  code: z.string().length(3),
});
export const CurrencySelect = createSelectSchema(s.currency, {
  code: z.string().length(3),
});
export const CurrencyUpdate = createUpdateSchema(s.currency, {
  code: z.string().length(3),
});

// Region
export const RegionInsert = createInsertSchema(s.region, {
  id: idWithPrefix('reg').optional(),
  metadata: jsonValue,
});
export const RegionSelect = createSelectSchema(s.region, {
  id: idWithPrefix('reg'),
  metadata: jsonValue,
});
export const RegionUpdate = createUpdateSchema(s.region, {
  metadata: jsonValue,
});

export const RegionCountryInsert = createInsertSchema(s.regionCountry, {
  metadata: jsonValue,
});
export const RegionCountrySelect = createSelectSchema(s.regionCountry, {
  metadata: jsonValue,
});
export const RegionCountryUpdate = createUpdateSchema(s.regionCountry, {
  metadata: jsonValue,
});

export const RegionPaymentProviderInsert = createInsertSchema(
  s.regionPaymentProvider,
  { id: idWithPrefix('rpp').optional() }
);
export const RegionPaymentProviderSelect = createSelectSchema(
  s.regionPaymentProvider,
  { id: idWithPrefix('rpp') }
);
export const RegionPaymentProviderUpdate = createUpdateSchema(
  s.regionPaymentProvider
);

// Location types & locations
export const LocationTypeInsert = createInsertSchema(s.locationType, {
  id: idWithPrefix('ltype').optional(),
});
export const LocationTypeSelect = createSelectSchema(s.locationType, {
  id: idWithPrefix('ltype'),
});
export const LocationTypeUpdate = createUpdateSchema(s.locationType);

export const LocationInsert = createInsertSchema(s.location, {
  id: idWithPrefix('loc').optional(),
  timezone: ianaTimezone,
});
export const LocationSelect = createSelectSchema(s.location, {
  id: idWithPrefix('loc'),
  timezone: ianaTimezone,
});
export const LocationUpdate = createUpdateSchema(s.location, {
  timezone: ianaTimezone,
});

// Address
export const AddressInsert = createInsertSchema(s.address, {
  id: idWithPrefix('addr').optional(),
  metadata: jsonValue,
});
export const AddressSelect = createSelectSchema(s.address, {
  id: idWithPrefix('addr'),
  metadata: jsonValue,
});
export const AddressUpdate = createUpdateSchema(s.address, {
  metadata: jsonValue,
});

// Tags
export const TagsInsert = createInsertSchema(s.tags, {
  id: idWithPrefix('tag').optional(),
});
export const TagsSelect = createSelectSchema(s.tags, {
  id: idWithPrefix('tag'),
});
export const TagsUpdate = createUpdateSchema(s.tags);

// Org settings & brand profile
export const OrganizationSettingsInsert = createInsertSchema(
  s.organizationSettings,
  {
    id: idWithPrefix('oset').optional(),
    featureFlags: jsonValue,
    metadata: jsonValue,
  }
);
export const OrganizationSettingsSelect = createSelectSchema(
  s.organizationSettings,
  { id: idWithPrefix('oset'), featureFlags: jsonValue, metadata: jsonValue }
);
export const OrganizationSettingsUpdate = createUpdateSchema(
  s.organizationSettings,
  { featureFlags: jsonValue, metadata: jsonValue }
);

export const BrandProfileInsert = createInsertSchema(s.brandProfile, {
  id: idWithPrefix('brand').optional(),
  brandIdentity: jsonValue,
  socialLinks: jsonValue,
  metadata: jsonValue,
});
export const BrandProfileSelect = createSelectSchema(s.brandProfile, {
  id: idWithPrefix('brand'),
  brandIdentity: jsonValue,
  socialLinks: jsonValue,
  metadata: jsonValue,
});
export const BrandProfileUpdate = createUpdateSchema(s.brandProfile, {
  brandIdentity: jsonValue,
  socialLinks: jsonValue,
  metadata: jsonValue,
});

// Sales channels & stock locations
export const StockLocationInsert = createInsertSchema(s.stockLocation, {
  id: idWithPrefix('sloc').optional(),
  metadata: jsonValue,
});
export const StockLocationSelect = createSelectSchema(s.stockLocation, {
  id: idWithPrefix('sloc'),
  metadata: jsonValue,
});
export const StockLocationUpdate = createUpdateSchema(s.stockLocation, {
  metadata: jsonValue,
});

export const SalesChannelInsert = createInsertSchema(s.salesChannel, {
  id: idWithPrefix('sc').optional(),
  metadata: jsonValue,
});
export const SalesChannelSelect = createSelectSchema(s.salesChannel, {
  id: idWithPrefix('sc'),
  metadata: jsonValue,
});
export const SalesChannelUpdate = createUpdateSchema(s.salesChannel, {
  metadata: jsonValue,
});

export const SalesChannelStockLocationInsert = createInsertSchema(
  s.salesChannelStockLocation,
  { id: idWithPrefix('scloc').optional() }
);
export const SalesChannelStockLocationSelect = createSelectSchema(
  s.salesChannelStockLocation,
  { id: idWithPrefix('scloc') }
);
export const SalesChannelStockLocationUpdate = createUpdateSchema(
  s.salesChannelStockLocation
);

// Product catalog
export const ProductTypeInsert = createInsertSchema(s.productType, {
  id: idWithPrefix('ptyp').optional(),
  metadata: jsonValue,
});
export const ProductTypeSelect = createSelectSchema(s.productType, {
  id: idWithPrefix('ptyp'),
  metadata: jsonValue,
});
export const ProductTypeUpdate = createUpdateSchema(s.productType, {
  metadata: jsonValue,
});

export const ProductCategoryInsert = createInsertSchema(s.productCategory, {
  id: idWithPrefix('pcat').optional(),
  metadata: jsonValue,
});
export const ProductCategorySelect = createSelectSchema(s.productCategory, {
  id: idWithPrefix('pcat'),
  metadata: jsonValue,
});
export const ProductCategoryUpdate = createUpdateSchema(s.productCategory, {
  metadata: jsonValue,
});

export const ProductInsert = createInsertSchema(s.product, {
  id: idWithPrefix('prod').optional(),
  metadata: jsonValue,
});
export const ProductSelect = createSelectSchema(s.product, {
  id: idWithPrefix('prod'),
  metadata: jsonValue,
});
export const ProductUpdate = createUpdateSchema(s.product, {
  metadata: jsonValue,
});

export const ProductVariantInsert = createInsertSchema(s.productVariant, {
  id: idWithPrefix('pvar').optional(),
  metadata: jsonValue,
});
export const ProductVariantSelect = createSelectSchema(s.productVariant, {
  id: idWithPrefix('pvar'),
  metadata: jsonValue,
});
export const ProductVariantUpdate = createUpdateSchema(s.productVariant, {
  metadata: jsonValue,
});

export const ProductGroupInsert = createInsertSchema(s.productGroup, {
  id: idWithPrefix('pcol').optional(),
  metadata: jsonValue,
});
export const ProductGroupSelect = createSelectSchema(s.productGroup, {
  id: idWithPrefix('pcol'),
  metadata: jsonValue,
});
export const ProductGroupUpdate = createUpdateSchema(s.productGroup, {
  metadata: jsonValue,
});

export const ProductGroupProductInsert = createInsertSchema(
  s.productGroupProduct,
  { id: idWithPrefix('pcolprod').optional() }
);
export const ProductGroupProductSelect = createSelectSchema(
  s.productGroupProduct,
  { id: idWithPrefix('pcolprod') }
);
export const ProductGroupProductUpdate = createUpdateSchema(
  s.productGroupProduct
);

export const ProductCategoryProductInsert = createInsertSchema(
  s.productCategoryProduct,
  { id: idWithPrefix('pcp').optional() }
);
export const ProductCategoryProductSelect = createSelectSchema(
  s.productCategoryProduct,
  { id: idWithPrefix('pcp') }
);
export const ProductCategoryProductUpdate = createUpdateSchema(
  s.productCategoryProduct
);

export const ProductTagInsert = createInsertSchema(s.productTag, {
  id: idWithPrefix('ptag').optional(),
});
export const ProductTagSelect = createSelectSchema(s.productTag, {
  id: idWithPrefix('ptag'),
});
export const ProductTagUpdate = createUpdateSchema(s.productTag);

// Pricing
export const PriceSetInsert = createInsertSchema(s.priceSet, {
  id: idWithPrefix('pset').optional(),
  rules: jsonValue,
  metadata: jsonValue,
});
export const PriceSetSelect = createSelectSchema(s.priceSet, {
  id: idWithPrefix('pset'),
  rules: jsonValue,
  metadata: jsonValue,
});
export const PriceSetUpdate = createUpdateSchema(s.priceSet, {
  rules: jsonValue,
  metadata: jsonValue,
});

export const PriceInsert = createInsertSchema(s.price, {
  id: idWithPrefix('price').optional(),
  amount: dineroSnapshot,
  minQuantity: NonNegativeInt.optional(),
  maxQuantity: NonNegativeInt.optional(),
  metadata: jsonValue,
});
export const PriceSelect = createSelectSchema(s.price, {
  id: idWithPrefix('price'),
  amount: dineroSnapshot,
  minQuantity: NonNegativeInt.optional(),
  maxQuantity: NonNegativeInt.optional(),
  metadata: jsonValue,
});
export const PriceUpdate = createUpdateSchema(s.price, {
  amount: dineroSnapshot.optional(),
  minQuantity: NonNegativeInt.optional(),
  maxQuantity: NonNegativeInt.optional(),
  metadata: jsonValue,
});

export const ProductVariantPriceSetInsert = createInsertSchema(
  s.productVariantPriceSet,
  { id: idWithPrefix('pvps').optional() }
);
export const ProductVariantPriceSetSelect = createSelectSchema(
  s.productVariantPriceSet,
  { id: idWithPrefix('pvps') }
);
export const ProductVariantPriceSetUpdate = createUpdateSchema(
  s.productVariantPriceSet
);

export const ProductSalesChannelInsert = createInsertSchema(
  s.productSalesChannel,
  {
    id: idWithPrefix('psc').optional(),
  }
);
export const ProductSalesChannelSelect = createSelectSchema(
  s.productSalesChannel,
  {
    id: idWithPrefix('psc'),
  }
);
export const ProductSalesChannelUpdate = createUpdateSchema(
  s.productSalesChannel
);

// Tax & Fees
export const TaxRateInsert = createInsertSchema(s.taxRate, {
  id: idWithPrefix('txr').optional(),
  rate: dineroSnapshot,
  rawRate: Percentage,
  metadata: jsonValue,
});
export const TaxRateSelect = createSelectSchema(s.taxRate, {
  id: idWithPrefix('txr'),
  rate: dineroSnapshot,
  rawRate: Percentage,
  metadata: jsonValue,
});
export const TaxRateUpdate = createUpdateSchema(s.taxRate, {
  rate: dineroSnapshot.optional(),
  rawRate: Percentage.optional(),
  metadata: jsonValue,
});

export const ProductVariantTaxRateInsert = createInsertSchema(
  s.productVariantTaxRate,
  { id: idWithPrefix('txrule').optional(), metadata: jsonValue }
);
export const ProductVariantTaxRateSelect = createSelectSchema(
  s.productVariantTaxRate,
  { id: idWithPrefix('txrule'), metadata: jsonValue }
);
export const ProductVariantTaxRateUpdate = createUpdateSchema(
  s.productVariantTaxRate,
  { metadata: jsonValue }
);

const FeeInsertBase = createInsertSchema(s.fee, {
  id: idWithPrefix('fee').optional(),
  percentage: Percentage.optional(),
  amount: dineroSnapshot.optional(),
  metadata: jsonValue,
});
export const FeeInsert = refineFee(FeeInsertBase);

const FeeSelectBase = createSelectSchema(s.fee, {
  id: idWithPrefix('fee'),
  percentage: Percentage.optional(),
  amount: dineroSnapshot.optional(),
  metadata: jsonValue,
});
export const FeeSelect = refineFee(FeeSelectBase);

export const FeeUpdate = createUpdateSchema(s.fee, {
  percentage: Percentage.optional(),
  amount: dineroSnapshot.optional(),
  metadata: jsonValue,
});

// Payments
export const PaymentProviderInsert = createInsertSchema(s.paymentProvider, {
  id: idWithPrefix('payp').optional(),
  config: jsonValue,
  metadata: jsonValue,
});
export const PaymentProviderSelect = createSelectSchema(s.paymentProvider, {
  id: idWithPrefix('payp'),
  config: jsonValue,
  metadata: jsonValue,
});
export const PaymentProviderUpdate = createUpdateSchema(s.paymentProvider, {
  config: jsonValue,
  metadata: jsonValue,
});

const PaymentCollectionInsertBase = createInsertSchema(s.paymentCollection, {
  id: idWithPrefix('payc').optional(),
  totalAmount: dineroSnapshot,
  authorizedAmount: dineroSnapshot.optional(),
  capturedAmount: dineroSnapshot.optional(),
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});
export const PaymentCollectionInsert = refineCartOrOrder(
  PaymentCollectionInsertBase
);

export const PaymentCollectionSelect = createSelectSchema(s.paymentCollection, {
  id: idWithPrefix('payc'),
  totalAmount: dineroSnapshot,
  authorizedAmount: dineroSnapshot.optional(),
  capturedAmount: dineroSnapshot.optional(),
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});

export const PaymentCollectionUpdate = createUpdateSchema(s.paymentCollection, {
  totalAmount: dineroSnapshot.optional(),
  authorizedAmount: dineroSnapshot.optional(),
  capturedAmount: dineroSnapshot.optional(),
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});

export const PaymentIntentInsert = createInsertSchema(s.paymentIntent, {
  id: idWithPrefix('payi').optional(),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentIntentSelect = createSelectSchema(s.paymentIntent, {
  id: idWithPrefix('payi'),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentIntentUpdate = createUpdateSchema(s.paymentIntent, {
  amount: dineroSnapshot.optional(),
  data: jsonValue,
  metadata: jsonValue,
});

export const PaymentAttemptInsert = createInsertSchema(s.paymentAttempt, {
  id: idWithPrefix('paya').optional(),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentAttemptSelect = createSelectSchema(s.paymentAttempt, {
  id: idWithPrefix('paya'),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentAttemptUpdate = createUpdateSchema(s.paymentAttempt, {
  amount: dineroSnapshot.optional(),
  data: jsonValue,
  metadata: jsonValue,
});

export const PaymentMethodInsert = createInsertSchema(s.paymentMethod, {
  id: idWithPrefix('paym').optional(),
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentMethodSelect = createSelectSchema(s.paymentMethod, {
  id: idWithPrefix('paym'),
  data: jsonValue,
  metadata: jsonValue,
});
export const PaymentMethodUpdate = createUpdateSchema(s.paymentMethod, {
  data: jsonValue,
  metadata: jsonValue,
});

export const RefundReasonInsert = createInsertSchema(s.refundReason, {
  id: idWithPrefix('payrr').optional(),
  metadata: jsonValue,
});
export const RefundReasonSelect = createSelectSchema(s.refundReason, {
  id: idWithPrefix('payrr'),
  metadata: jsonValue,
});
export const RefundReasonUpdate = createUpdateSchema(s.refundReason, {
  metadata: jsonValue,
});

export const RefundInsert = createInsertSchema(s.refund, {
  id: idWithPrefix('payr').optional(),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const RefundSelect = createSelectSchema(s.refund, {
  id: idWithPrefix('payr'),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const RefundUpdate = createUpdateSchema(s.refund, {
  amount: dineroSnapshot.optional(),
  data: jsonValue,
  metadata: jsonValue,
});

export const InvoiceInsert = createInsertSchema(s.invoice, {
  id: idWithPrefix('inv').optional(),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const InvoiceSelect = createSelectSchema(s.invoice, {
  id: idWithPrefix('inv'),
  amount: dineroSnapshot,
  data: jsonValue,
  metadata: jsonValue,
});
export const InvoiceUpdate = createUpdateSchema(s.invoice, {
  amount: dineroSnapshot.optional(),
  data: jsonValue,
  metadata: jsonValue,
});

export const SubscriptionInsert = createInsertSchema(s.subscription, {
  id: idWithPrefix('sub').optional(),
  data: jsonValue,
  metadata: jsonValue,
});
export const SubscriptionSelect = createSelectSchema(s.subscription, {
  id: idWithPrefix('sub'),
  data: jsonValue,
  metadata: jsonValue,
});
export const SubscriptionUpdate = createUpdateSchema(s.subscription, {
  data: jsonValue,
  metadata: jsonValue,
});

const SubscriptionSchedulePhaseInsertBase = createInsertSchema(
  s.subscriptionSchedulePhase,
  {
    id: idWithPrefix('subp').optional(),
    amount: dineroSnapshot.optional(),
    data: jsonValue,
    metadata: jsonValue,
  }
);
export const SubscriptionSchedulePhaseInsert = refineSchedulePhase(
  SubscriptionSchedulePhaseInsertBase
);

const SubscriptionSchedulePhaseSelectBase = createSelectSchema(
  s.subscriptionSchedulePhase,
  {
    id: idWithPrefix('subp'),
    amount: dineroSnapshot.optional(),
    data: jsonValue,
    metadata: jsonValue,
  }
);
export const SubscriptionSchedulePhaseSelect = refineSchedulePhase(
  SubscriptionSchedulePhaseSelectBase
);

export const SubscriptionSchedulePhaseUpdate = createUpdateSchema(
  s.subscriptionSchedulePhase,
  { amount: dineroSnapshot.optional(), data: jsonValue, metadata: jsonValue }
);

export const InstallmentInsert = createInsertSchema(s.installment, {
  id: idWithPrefix('inst').optional(),
  amount: dineroSnapshot,
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});
export const InstallmentSelect = createSelectSchema(s.installment, {
  id: idWithPrefix('inst'),
  amount: dineroSnapshot,
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});
export const InstallmentUpdate = createUpdateSchema(s.installment, {
  amount: dineroSnapshot.optional(),
  refundedAmount: dineroSnapshot.optional(),
  metadata: jsonValue,
});

// Promotion
export const PromotionInsert = createInsertSchema(s.promotion);
export const PromotionSelect = createSelectSchema(s.promotion);
export const PromotionUpdate = createUpdateSchema(s.promotion);
