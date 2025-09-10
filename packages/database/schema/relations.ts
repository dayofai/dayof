import { defineRelations } from 'drizzle-orm';
// import { address } from './address';
// import { organization } from './better-auth';
// import { currency } from './currency';
// import { location, locationType } from './location';
// import { brandProfile, organizationSettings } from './organization';
// import { price, priceSet } from './pricing';
// import {
//   product,
//   productCategory,
//   productCategoryProduct,
//   productGroup,
//   productGroupProduct,
//   productSalesChannel,
//   productTag,
//   productType,
//   productVariant,
//   productVariantPriceSet,
// } from './product';
// import { region, regionCountry, regionPaymentProvider } from './region';
// import {
//   salesChannel,
//   salesChannelStockLocation,
//   stockLocation,
// } from './sales-channel';
// import { tags } from './tag';
// import { productVariantTaxRate, taxRate } from './tax';
import {
  walletApnsKey,
  walletCert,
  walletDevice,
  walletPass,
  walletPassContent,
  walletPassType,
  walletRegistration,
} from './wallet';

const schemaTables = {
  // wallet
  walletPass,
  walletPassType,
  walletPassContent,
  walletRegistration,
  walletDevice,
  walletCert,
  walletApnsKey,
  // region
  // region,
  // regionCountry,
  // regionPaymentProvider,
  // pricing
  // priceSet,
  // price,
  // sales-channel
  // salesChannel,
  // salesChannelStockLocation,
  // stockLocation,
  // product domain
  // product,
  // productType,
  // productCategory,
  // productCategoryProduct,
  // productGroup,
  // productGroupProduct,
  // productTag,
  // productVariant,
  // productVariantPriceSet,
  // productSalesChannel,
  // tagging
  // tags,
  // tax
  // taxRate,
  // productVariantTaxRate,
  // location & address
  // locationType,
  // location,
  // address,
  // org & brand
  // organizationSettings,
  // brandProfile,
  // organization,
  // currency
  // currency,
} as const;

export const relations = defineRelations(schemaTables, (r) => ({
  // Wallet (PassKit)
  walletPass: {
    passType: r.one.walletPassType({
      from: r.walletPass.passTypeIdentifier,
      to: r.walletPassType.passTypeIdentifier,
    }),
    content: r.one.walletPassContent({
      from: r.walletPass.id,
      to: r.walletPassContent.passId,
    }),
    registrations: r.many.walletRegistration({
      from: r.walletPass.id,
      to: r.walletRegistration.passId,
    }),
  },
  walletRegistration: {
    device: r.one.walletDevice({
      from: r.walletRegistration.deviceLibraryIdentifier,
      to: r.walletDevice.deviceLibraryIdentifier,
    }),
    pass: r.one.walletPass({
      from: r.walletRegistration.passId,
      to: r.walletPass.id,
    }),
  },
  walletPassType: {
    cert: r.one.walletCert({
      from: r.walletPassType.certRef,
      to: r.walletCert.certRef,
    }),
    passes: r.many.walletPass({
      from: r.walletPassType.passTypeIdentifier,
      to: r.walletPass.passTypeIdentifier,
    }),
  },
  walletDevice: {
    registrations: r.many.walletRegistration({
      from: r.walletDevice.deviceLibraryIdentifier,
      to: r.walletRegistration.deviceLibraryIdentifier,
    }),
  },
  walletApnsKey: {
    certByTeam: r.one.walletCert({
      from: r.walletApnsKey.teamId,
      to: r.walletCert.teamId,
    }),
  },
  walletCert: {
    passTypes: r.many.walletPassType({
      from: r.walletCert.certRef,
      to: r.walletPassType.certRef,
    }),
    apnsKeys: r.many.walletApnsKey({
      from: r.walletCert.teamId,
      to: r.walletApnsKey.teamId,
    }),
  },
  walletPassContent: {
    pass: r.one.walletPass({
      from: r.walletPassContent.passId,
      to: r.walletPass.id,
    }),
  },

  // Region
  // region: {
  //   countries: r.many.regionCountry({
  //     from: r.region.id,
  //     to: r.regionCountry.regionId,
  //   }),
  //   paymentProviders: r.many.regionPaymentProvider({
  //     from: r.region.id,
  //     to: r.regionPaymentProvider.regionId,
  //   }),
  // },
  // regionCountry: {
  //   region: r.one.region({
  //     from: r.regionCountry.regionId,
  //     to: r.region.id,
  //   }),
  //   addresses: r.many.address({
  //     from: r.regionCountry.iso2,
  //     to: r.address.countryCode,
  //   }),
  //   brandProfiles: r.many.brandProfile({
  //     from: r.regionCountry.iso2,
  //     to: r.brandProfile.countryCode,
  //   }),
  //   orgSettings: r.many.organizationSettings({
  //     from: r.regionCountry.iso2,
  //     to: r.organizationSettings.defaultCountryCode,
  //   }),
  // },
  // regionPaymentProvider: {
  //   region: r.one.region({
  //     from: r.regionPaymentProvider.regionId,
  //     to: r.region.id,
  //   }),
  //   // payment provider relation omitted
  // },

  // Pricing
  // priceSet: {
  //   prices: r.many.price({
  //     from: r.priceSet.id,
  //     to: r.price.priceSetId,
  //   }),
  //   variantPriceSets: r.many.productVariantPriceSet({
  //     from: r.priceSet.id,
  //     to: r.productVariantPriceSet.priceSetId,
  //   }),
  // },
  // price: {
  //   priceSet: r.one.priceSet({
  //     from: r.price.priceSetId,
  //     to: r.priceSet.id,
  //   }),
  // },
  // productVariantPriceSet: {
  //   variant: r.one.productVariant({
  //     from: r.productVariantPriceSet.variantId,
  //     to: r.productVariant.id,
  //   }),
  //   priceSet: r.one.priceSet({
  //     from: r.productVariantPriceSet.priceSetId,
  //     to: r.priceSet.id,
  //   }),
  // },

  // Sales channel
  // salesChannel: {
  //   stockLocations: r.many.salesChannelStockLocation({
  //     from: r.salesChannel.id,
  //     to: r.salesChannelStockLocation.salesChannelId,
  //   }),
  //   products: r.many.productSalesChannel({
  //     from: r.salesChannel.id,
  //     to: r.productSalesChannel.salesChannelId,
  //   }),
  // },
  // salesChannelStockLocation: {
  //   salesChannel: r.one.salesChannel({
  //     from: r.salesChannelStockLocation.salesChannelId,
  //     to: r.salesChannel.id,
  //   }),
  //   stockLocation: r.one.stockLocation({
  //     from: r.salesChannelStockLocation.locationId,
  //     to: r.stockLocation.id,
  //   }),
  // },
  // stockLocation: {
  //   address: r.one.address({
  //     from: r.stockLocation.addressId,
  //     to: r.address.id,
  //   }),
  //   salesChannels: r.many.salesChannelStockLocation({
  //     from: r.stockLocation.id,
  //     to: r.salesChannelStockLocation.locationId,
  //   }),
  // },
  // productSalesChannel: {
  //   product: r.one.product({
  //     from: r.productSalesChannel.productId,
  //     to: r.product.id,
  //   }),
  //   salesChannel: r.one.salesChannel({
  //     from: r.productSalesChannel.salesChannelId,
  //     to: r.salesChannel.id,
  //   }),
  // },

  // Product domain
  // productType: {
  //   products: r.many.product({
  //     from: r.productType.id,
  //     to: r.product.typeId,
  //   }),
  // },
  // product: {
  //   type: r.one.productType({
  //     from: r.product.typeId,
  //     to: r.productType.id,
  //   }),
  //   brandProfile: r.one.brandProfile({
  //     from: r.product.brandProfileId,
  //     to: r.brandProfile.id,
  //   }),
  //   variants: r.many.productVariant({
  //     from: r.product.id,
  //     to: r.productVariant.productId,
  //   }),
  //   groups: r.many.productGroupProduct({
  //     from: r.product.id,
  //     to: r.productGroupProduct.productId,
  //   }),
  //   categories: r.many.productCategoryProduct({
  //     from: r.product.id,
  //     to: r.productCategoryProduct.productId,
  //   }),
  //   tags: r.many.productTag({
  //     from: r.product.id,
  //     to: r.productTag.productId,
  //   }),
  //   salesChannels: r.many.productSalesChannel({
  //     from: r.product.id,
  //     to: r.productSalesChannel.productId,
  //   }),
  // },
  // productVariant: {
  //   product: r.one.product({
  //     from: r.productVariant.productId,
  //     to: r.product.id,
  //   }),
  //   priceSets: r.many.productVariantPriceSet({
  //     from: r.productVariant.id,
  //     to: r.productVariantPriceSet.variantId,
  //   }),
  //   taxRates: r.many.productVariantTaxRate({
  //     from: r.productVariant.id,
  //     to: r.productVariantTaxRate.productVariantId,
  //   }),
  // },
  // productGroup: {
  //   items: r.many.productGroupProduct({
  //     from: r.productGroup.id,
  //     to: r.productGroupProduct.productGroupId,
  //   }),
  // },
  // productGroupProduct: {
  //   productGroup: r.one.productGroup({
  //     from: r.productGroupProduct.productGroupId,
  //     to: r.productGroup.id,
  //   }),
  //   product: r.one.product({
  //     from: r.productGroupProduct.productId,
  //     to: r.product.id,
  //   }),
  // },
  // productCategory: {
  //   parent: r.one.productCategory({
  //     from: r.productCategory.parentCategoryId,
  //     to: r.productCategory.id,
  //   }),
  //   children: r.many.productCategory({
  //     from: r.productCategory.id,
  //     to: r.productCategory.parentCategoryId,
  //   }),
  //   items: r.many.productCategoryProduct({
  //     from: r.productCategory.id,
  //     to: r.productCategoryProduct.categoryId,
  //   }),
  // },
  // productCategoryProduct: {
  //   product: r.one.product({
  //     from: r.productCategoryProduct.productId,
  //     to: r.product.id,
  //   }),
  //   category: r.one.productCategory({
  //     from: r.productCategoryProduct.categoryId,
  //     to: r.productCategory.id,
  //   }),
  // },
  // productTag: {
  //   product: r.one.product({
  //     from: r.productTag.productId,
  //     to: r.product.id,
  //   }),
  //   tag: r.one.tags({
  //     from: r.productTag.tagId,
  //     to: r.tags.id,
  //   }),
  // },
  // tags: {
  //   productTags: r.many.productTag({
  //     from: r.tags.id,
  //     to: r.productTag.tagId,
  //   }),
  // },

  // Tax
  // taxRate: {
  //   variantRates: r.many.productVariantTaxRate({
  //     from: r.taxRate.id,
  //     to: r.productVariantTaxRate.taxRateId,
  //   }),
  // },
  // productVariantTaxRate: {
  //   taxRate: r.one.taxRate({
  //     from: r.productVariantTaxRate.taxRateId,
  //     to: r.taxRate.id,
  //   }),
  //   variant: r.one.productVariant({
  //     from: r.productVariantTaxRate.productVariantId,
  //     to: r.productVariant.id,
  //   }),
  // },

  // Location & Address
  // locationType: {
  //   locations: r.many.location({
  //     from: r.locationType.id,
  //     to: r.location.locationTypeId,
  //   }),
  // },
  // location: {
  //   type: r.one.locationType({
  //     from: r.location.locationTypeId,
  //     to: r.locationType.id,
  //   }),
  //   parent: r.one.location({
  //     from: r.location.locationParentId,
  //     to: r.location.id,
  //   }),
  //   children: r.many.location({
  //     from: r.location.id,
  //     to: r.location.locationParentId,
  //   }),
  // },
  // address: {
  //   country: r.one.regionCountry({
  //     from: r.address.countryCode,
  //     to: r.regionCountry.iso2,
  //   }),
  // },

  // Organization & Brand
  // organizationSettings: {
  //   organization: r.one.organization({
  //     from: r.organizationSettings.orgId,
  //     to: r.organization.id,
  //   }),
  //   defaultCurrency: r.one.currency({
  //     from: r.organizationSettings.defaultCurrencyCode,
  //     to: r.currency.code,
  //   }),
  //   defaultCountry: r.one.regionCountry({
  //     from: r.organizationSettings.defaultCountryCode,
  //     to: r.regionCountry.iso2,
  //   }),
  //   defaultTaxRate: r.one.taxRate({
  //     from: r.organizationSettings.defaultTaxRateId,
  //     to: r.taxRate.id,
  //   }),
  //   businessAddress: r.one.address({
  //     from: r.organizationSettings.businessAddressId,
  //     to: r.address.id,
  //   }),
  // },
  // brandProfile: {
  //   currency: r.one.currency({
  //     from: r.brandProfile.currencyCode,
  //     to: r.currency.code,
  //   }),
  //   country: r.one.regionCountry({
  //     from: r.brandProfile.countryCode,
  //     to: r.regionCountry.iso2,
  //   }),
  //   defaultTaxRate: r.one.taxRate({
  //     from: r.brandProfile.defaultTaxRateId,
  //     to: r.taxRate.id,
  //   }),
  //   products: r.many.product({
  //     from: r.brandProfile.id,
  //     to: r.product.brandProfileId,
  //   }),
  // },
}));
