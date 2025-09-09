import { defineRelations } from 'drizzle-orm';
// import { paymentProvider } from './payment'; // Omitted for wallet-only test run
import { price, priceSet } from './pricing';
import { productSalesChannel } from './product';
import { region, regionCountry, regionPaymentProvider } from './region';
import {
  salesChannel,
  salesChannelStockLocation,
  stockLocation,
} from './sales-channel';
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
  region,
  regionCountry,
  regionPaymentProvider,
  // payment (omitted)
  // pricing
  priceSet,
  price,
  // sales-channel
  salesChannel,
  salesChannelStockLocation,
  stockLocation,
  // product junction
  productSalesChannel,
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
  region: {
    countries: r.many.regionCountry({
      from: r.region.id,
      to: r.regionCountry.regionId,
    }),
    paymentProviders: r.many.regionPaymentProvider({
      from: r.region.id,
      to: r.regionPaymentProvider.regionId,
    }),
  },
  regionCountry: {
    region: r.one.region({
      from: r.regionCountry.regionId,
      to: r.region.id,
    }),
  },
  regionPaymentProvider: {
    region: r.one.region({
      from: r.regionPaymentProvider.regionId,
      to: r.region.id,
    }),
    paymentProvider: r.one.paymentProvider({
      from: r.regionPaymentProvider.paymentProviderId,
      to: r.paymentProvider.id,
    }),
  },

  // Pricing
  priceSet: {
    prices: r.many.price({
      from: r.priceSet.id,
      to: r.price.priceSetId,
    }),
  },
  price: {
    priceSet: r.one.priceSet({
      from: r.price.priceSetId,
      to: r.priceSet.id,
    }),
  },

  // Sales channel
  salesChannel: {
    stockLocations: r.many.salesChannelStockLocation({
      from: r.salesChannel.id,
      to: r.salesChannelStockLocation.salesChannelId,
    }),
    products: r.many.productSalesChannel({
      from: r.salesChannel.id,
      to: r.productSalesChannel.salesChannelId,
    }),
  },
  salesChannelStockLocation: {
    salesChannel: r.one.salesChannel({
      from: r.salesChannelStockLocation.salesChannelId,
      to: r.salesChannel.id,
    }),
    stockLocation: r.one.stockLocation({
      from: r.salesChannelStockLocation.locationId,
      to: r.stockLocation.id,
    }),
  },
}));
