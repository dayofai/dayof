/**
 * Products Domain
 *
 * Product selection interface for events. Handles all purchasable items:
 * - Tickets (general admission, VIP, early bird, etc.)
 * - Merchandise (t-shirts, posters, albums, etc.)
 * - Parking passes
 * - VIP upgrades
 * - Add-ons (meet & greet, photo packages, etc.)
 *
 * Key Principle:
 * This is a PRODUCT SELECTION interface, not a traditional cart.
 * Users interact with products directly (inline quantity selectors),
 * and the "cart" is just a reactive summary footer showing totals.
 *
 * The cart management is a byproduct of product selection - it's not
 * actively managed by the user like a traditional e-commerce cart page.
 * There's no "view cart" or "cart drawer" - selections happen inline
 * on the product panel, and the summary updates reactively.
 */

// ============================================================================
// IMPORT PATTERNS
// ============================================================================
//
// Route usage:
// import { ProductsPanel } from '@/products';
//
// Component usage:
// import { ProductCard, QuantityStepper } from '@/products';
//
// Utils usage:
// import { computeProductUI } from '@/products/computeProductUI';
//
// Types usage:
// import type { Product, ProductUIState } from '@/products/types';

// ============================================================================
// SCHEMA LOCATION
// ============================================================================
//
// Product schemas live in @/lib/schemas/ (shared):
// - @/lib/schemas/product.ts    (replaces tickets.ts)
// - @/lib/schemas/cart.ts       (unchanged)
// - @/lib/schemas/event.ts      (unchanged)
//
// Why separate from domain folder:
// - Schemas are shared across frontend + backend
// - Used in API validation, database types, UI
// - Centralized location prevents duplication

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
//
// Jotai atoms live in @/lib/atoms/ (shared):
// - @/lib/atoms/cart.ts              (cart items, increment/decrement)
// - @/lib/atoms/product-ui-states.ts (derived UI states)
// - @/lib/atoms/pricing.ts           (server pricing query)
//
// TanStack Query:
// - @/lib/queries/products.ts        (fetch products for event)
// - @/lib/queries/pricing.ts         (calculate cart totals)
//
// Why shared location:
// - Atoms are global state (accessed from multiple domains)
// - Query definitions are reusable
// - Centralized prevents atom key collisions

// ============================================================================
// PUBLIC EXPORTS (when built)
// ============================================================================

// Main component
// export { ProductsPanel } from './ProductsPanel';

// Sub-components (for custom layouts)
// export { ProductCard } from './ProductCard';
// export { ProductList } from './ProductList';
// export { QuantityStepper } from './QuantityStepper';
// export { CartSummary } from './CartSummary';
// export { ProductPrice } from './ProductPrice';

// Business logic (for testing/reuse)
// export { computeProductUI } from './computeProductUI';

// Types (for consumers)
// export type { ProductUIState } from './types';

