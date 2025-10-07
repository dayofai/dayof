import {
  createCollection,
  localOnlyCollectionOptions,
  localStorageCollectionOptions,
} from '@tanstack/react-db';
import { cartItemSchema } from '@/lib/schemas/cart';
import { isServer } from '@/lib/utils/env';

const CART_VERSION = 1;
const STORAGE_KEY = `frontrow:ticket-cart:v${CART_VERSION}`;

if (!isServer) {
  const PREFIX = 'frontrow:ticket-cart:';
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PREFIX) && key !== STORAGE_KEY) {
      localStorage.removeItem(key);
    }
  }
}

export const cartCollection = isServer
  ? createCollection(
      localOnlyCollectionOptions({
        id: 'ticket-cart-ssr-stub',
        getKey: (item) => item.ticketId,
        schema: cartItemSchema,
        initialData: [],
      })
    )
  : createCollection(
      localStorageCollectionOptions({
        id: 'ticket-cart',
        storageKey: STORAGE_KEY,
        getKey: (item) => item.ticketId,
        schema: cartItemSchema,
      })
    );
