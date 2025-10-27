  # Product Panel Implementation Guide

  **Version:** 1.0 (based on Spec v0.4)
  **Last Updated:** 2025-10-26
  **Purpose:** Primary implementation reference for building the Product Panel component

  ---

  ## Table of Contents

  1. [Quick Start & Overview](#1-quick-start--overview)
  2. [Data Contract & Validation](#2-data-contract--validation)
  3. [State Management Architecture](#3-state-management-architecture)
  4. [Component Structure](#4-component-structure)
  5. [Rendering Logic](#5-rendering-logic)
  6. [User Interactions](#6-user-interactions)
  7. [Edge Cases & Testing](#7-edge-cases--testing)
  8. [Quick Reference](#8-quick-reference)

  ---

  ## 1. Quick Start & Overview

  ### 1.1 What is the Product Panel?

  The Product Panel is a **server-driven commerce UI** for selecting tickets, digital items, and physical products. Key
  characteristics:

  - **Server Authority**: All business logic (pricing, availability, limits) computed server-side
  - **Client as View**: Client validates, derives UI state, and enforces server rules—never invents them
  - **Orthogonal Axes**: Four independent state dimensions compose into final presentation
  - **Strict Validation**: Zod schemas enforce contract; unknown fields = errors
  - **Zero Math**: No price calculations, quantity limits, or eligibility checks client-side

  ### 1.2 Core Principles

  ```typescript
  // ✅ Client role
  const presentation = derivePresentation(serverPayload);
  const isPurchasable = checkPurchasability(serverPayload);
  const cta = selectCTA(serverPayload);

  // ❌ Client MUST NEVER
  // - Compute totals/fees/taxes
  // - Derive limits from stock counts
  // - Validate access codes
  // - Predict state transitions
  // - Invent UI text

  1.3 The Orthogonal Axes Model

  Four independent state dimensions per item:

  | Axis     | Question                | Values                             |
  |----------|-------------------------|------------------------------------|
  | Temporal | Is it the right time?   | before, during, after              |
  | Supply   | Do we have stock?       | available, none, unknown           |
  | Gating   | Does user have access?  | required, satisfied, listingPolicy |
  | Demand   | What if they can't buy? | none, waitlist, notify_me          |

  Purchasable = all four axes allow it AND maxSelectable > 0.

  1.4 Tech Stack

  - Framework: React with TypeScript
  - State: Jotai (atomic state management)
  - Data Fetching: TanStack Query
  - Validation: Zod 4
  - Money: Dinero.js V2 snapshots

  ---
  2. Data Contract & Validation

  2.1 Root Payload Schema

  import { z } from "zod";

  // Root shape: exactly four top-level keys
  const PanelDataSchema = z.object({
    context: ContextSchema,      // Panel config, rules, copy
    sections: SectionsSchema,     // Grouping/navigation
    items: ItemsSchema,           // Products with state
    pricing: PricingSchema,       // Server-computed money
  }).strict(); // Unknown keys = validation error

  type PanelData = z.infer<typeof PanelDataSchema>;

  Rule: Payloads MUST have exactly these four keys. Unknown keys rejected.

  2.2 Context Schema

  Server configuration, ordering rules, and copy artifacts.

  const ContextSchema = z.object({
    // Selection rules (REQUIRED)
    orderRules: z.object({
      types: z.enum(["single", "multiple"]),
      typesPerOrder: z.enum(["single", "multiple"]),
      ticketsPerType: z.enum(["single", "multiple"]),
      minSelectedTypes: z.number().int().min(0),
      minTicketsPerSelectedType: z.number().int().min(0),
    }),

    // Gating summary (REQUIRED if gating exists)
    gatingSummary: z.object({
      hasHiddenGatedItems: z.boolean(), // Only hint about omitted items
      hasAccessCode: z.boolean().optional(),
    }).optional(),

    // Panel-level banners (REQUIRED, may be empty)
    panelNotices: z.array(z.object({
      code: z.string().regex(/^[a-z][a-z0-9_]*$/), // snake_case
      icon: z.string().optional(),
      title: z.string().optional(),
      text: z.string().optional(),
      description: z.string().optional(),
      params: z.record(z.unknown()).optional(),
      variant: z.enum(["neutral", "info", "warning", "error"]).optional(),
      priority: z.number().default(0),
      action: z.object({
        label: z.string(),
        kind: z.enum(["link", "drawer"]),
        target: z.string().optional(),
      }).optional(),
      expiresAt: z.string().optional(), // ISO timestamp
    })),

    // Display preferences (UI hints)
    effectivePrefs: z.object({
      showTypeListWhenSoldOut: z.boolean(),
      displayPaymentPlanAvailable: z.boolean(),
      displayRemainingThreshold: z.number().optional(),
    }),

    // Optional welcome text
    welcomeText: z.string().optional(),

    // Copy artifacts
    copyTemplates: z.array(z.object({
      key: z.string(),
      template: z.string(),
      locale: z.string().optional(),
    })).optional(),

    clientCopy: z.record(z.string()).optional(),

    tooltips: z.array(z.object({
      id: z.string(),
      text: z.string(),
    })).optional(),

    hovercards: z.array(z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
    })).optional(),
  });

  Implementation Note: Context is read-only config. Store in a contextAtom and reference throughout the UI.

  2.3 Sections Schema

  const SectionSchema = z.object({
    id: z.string(),
    label: z.string(),
    order: z.number().int(),
    labelOverride: z.string().nullable().optional(),
  });

  const SectionsSchema = z.array(SectionSchema).min(1); // At least one section

  Rendering Rule: Sections with no assigned items MAY be hidden. Items without display.sectionId render in first section
  by order.

  2.4 Item Schema (The Big One)

  Each item represents a purchasable product (ticket, digital, physical) or an add-on.

  const ItemSchema = z.object({
    // Identity
    product: z.object({
      id: z.string(), // Unique in payload
      name: z.string(),
      type: z.enum(["ticket", "digital", "physical"]),
      description: z.string().optional(),
      subtitle: z.string().optional(),
      category: z.string().optional(),
      fulfillment: z.object({
        methods: z.array(z.enum([
          "eticket", "apple_pass", "will_call",
          "physical_mail", "shipping", "nfc"
        ])),
        details: z.record(z.unknown()).optional(),
      }).optional(),
    }).strict(),

    // Variant (forward-compat, often empty for GA tickets)
    variant: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      attributes: z.record(z.unknown()).optional(),
    }).optional(),

    // STATE: Four orthogonal axes + messages
    state: z.object({
      temporal: z.object({
        phase: z.enum(["before", "during", "after"]),
        reasons: z.array(z.string()),
        currentWindow: z.object({
          startsAt: z.string().optional(),
          endsAt: z.string().optional(),
        }).optional(),
        nextWindow: z.object({
          startsAt: z.string().optional(),
          endsAt: z.string().optional(),
        }).optional(),
      }),

      supply: z.object({
        status: z.enum(["available", "none", "unknown"]),
        remaining: z.number().int().min(0).optional(),
        reasons: z.array(z.string()),
      }),

      gating: z.object({
        required: z.boolean(),
        satisfied: z.boolean(),
        listingPolicy: z.enum(["omit_until_unlocked", "visible_locked"]),
        reasons: z.array(z.string()),
        requirements: z.array(z.object({
          kind: z.string(),
          satisfied: z.boolean(),
          validWindow: z.object({
            startsAt: z.string(),
            endsAt: z.string(),
          }).optional(),
          limit: z.object({
            maxUses: z.number().optional(),
            usesRemaining: z.number().optional(),
          }).optional(),
        })).optional(),
      }),

      demand: z.object({
        kind: z.enum(["none", "waitlist", "notify_me"]),
        reasons: z.array(z.string()),
      }),

      // Unified message channel (row display text)
      messages: z.array(z.object({
        code: z.string().regex(/^[a-z][a-z0-9_]*$/),
        text: z.string().optional(),
        params: z.record(z.unknown()).optional(),
        placement: z.enum([
          "row.under_title",
          "row.under_price",
          "row.under_quantity",
          "row.footer",
          "row.cta_label",
        ]),
        variant: z.enum(["neutral", "info", "warning", "error"]).optional(),
        priority: z.number().default(0),
      })),
    }),

    // COMMERCIAL: Price + authoritative clamp
    commercial: z.object({
      price: DineroSnapshotSchema, // See below
      feesIncluded: z.boolean(),
      maxSelectable: z.number().int().min(0), // THE clamp
      limits: z.object({
        perOrder: z.number().int().optional(),
        perUser: z.number().int().optional(),
      }).optional(),
    }),

    // DISPLAY: View hints
    display: z.object({
      badges: z.array(z.string()),
      badgeDetails: z.record(z.object({
        kind: z.enum(["tooltip", "hovercard"]),
        ref: z.string(),
      })).optional(),
      sectionId: z.string().optional(),
      showLowRemaining: z.boolean(),
    }),

    // RELATIONS: Add-on dependencies (optional)
    relations: z.object({
      parentProductIds: z.array(z.string()).optional(),
      matchBehavior: z.enum(["per_ticket", "per_order"]).optional(),
    }).optional(),
  }).strict();

  const ItemsSchema = z.array(ItemSchema); // May be empty

  Key Validation Rules:
  - product.id must be unique across payload
  - Items with gating.required && !satisfied && listingPolicy="omit_until_unlocked" should NOT be in items[]
  - All commercial.price.currency.code must match pricing.currency.code

  2.5 Dinero Snapshot Schema

  All money is represented as Dinero.js V2 snapshots.

  const CurrencySchema = z.object({
    code: z.string(), // e.g., "USD"
    base: z.number(), // e.g., 10
    exponent: z.number(), // e.g., 2
  });

  const DineroSnapshotSchema = z.object({
    amount: z.number().int(), // Minor units (e.g., 5000 = $50.00)
    currency: CurrencySchema,
    scale: z.number(), // Precision (usually 2)
  });

  // Helper: Format for display
  function formatDinero(snapshot: z.infer<typeof DineroSnapshotSchema>): string {
    const { amount, currency, scale } = snapshot;
    const divisor = Math.pow(currency.base, scale);
    const value = amount / divisor;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
    }).format(value);
  }

  Rule: Client MUST NOT perform arithmetic on money. Only format for display.

  2.6 Pricing Schema

  Server-computed breakdown of totals, fees, taxes, discounts.

  const PricingSchema = z.object({
    currency: CurrencySchema, // Must match all item currencies
    mode: z.enum(["reserve", "final"]).optional(), // Status hint
    lineItems: z.array(z.object({
      code: z.string(), // e.g., "TICKETS", "FEES", "TAX", "TOTAL"
      label: z.string(), // Display text
      amount: DineroSnapshotSchema, // Can be negative for discounts
    })),
  });

  Rendering Rule: Display lineItems in exact payload order. Never reorder, compute, or insert rows.

  2.7 Validation Strategy

  // At API boundary (TanStack Query)
  export function usePanelData() {
    return useQuery({
      queryKey: ["panel", eventId],
      queryFn: async () => {
        const response = await fetch(`/api/panel/${eventId}`);
        const json = await response.json();

        // Validate immediately
        const result = PanelDataSchema.safeParse(json);

        if (!result.success) {
          // Log detailed errors in dev
          console.error("Panel validation failed:", result.error.format());

          // Throw for error boundary
          throw new Error("Invalid panel data received from server");
        }

        // Additional checks
        validateCurrencyConsistency(result.data);
        validateUniqueProductIds(result.data);

        return result.data;
      },
    });
  }

  function validateCurrencyConsistency(data: PanelData) {
    const currencyCode = data.pricing.currency.code;

    for (const item of data.items) {
      if (item.commercial.price.currency.code !== currencyCode) {
        throw new Error(
          `Currency mismatch: item ${item.product.id} has ${item.commercial.price.currency.code}, ` +
          `but pricing uses ${currencyCode}`
        );
      }
    }
  }

  function validateUniqueProductIds(data: PanelData) {
    const ids = new Set<string>();

    for (const item of data.items) {
      if (ids.has(item.product.id)) {
        throw new Error(`Duplicate product ID: ${item.product.id}`);
      }
      ids.add(item.product.id);
    }
  }

  Error Handling:
  - Validation errors → show generic error UI, log details
  - Unknown fields → reject payload (strict mode)
  - Currency mismatch → fatal error, cannot render

  ---
  3. State Management Architecture

  3.1 Atom Structure Overview

  panelDataAtom (server payload)
      ↓
  selectionAtom (user selections: Map<productId, quantity>)
      ↓
  Derived Atoms (computed from above):
      - itemPresentationAtoms
      - itemPurchasabilityAtoms
      - itemCTAAtoms
      - panelActionButtonAtom
      - accessCodeCTAAtom
      - pricingFooterAtom

  Key Principle: Atoms are pure functions over server state + user selections. They NEVER contain business logic—only
  transformation of server data into UI state.

  3.2 Core Atoms

  import { atom } from "jotai";
  import type { PanelData } from "./schemas";

  // ========================================
  // Base Atoms (sources of truth)
  // ========================================

  export const panelDataAtom = atom<PanelData | null>(null);

  export const selectionAtom = atom<Map<string, number>>(new Map());

  // ========================================
  // Derived Atoms (computed UI state)
  // ========================================

  // Per-item presentation state
  export const itemPresentationAtom = atom((get) => {
    const data = get(panelDataAtom);
    if (!data) return new Map();

    const presentations = new Map<string, "normal" | "locked">();

    for (const item of data.items) {
      const g = item.state.gating;
      const isLocked = g.required && !g.satisfied && g.listingPolicy === "visible_locked";
      presentations.set(item.product.id, isLocked ? "locked" : "normal");
    }

    return presentations;
  });

  // Per-item purchasability
  export const itemPurchasabilityAtom = atom((get) => {
    const data = get(panelDataAtom);
    if (!data) return new Map();

    const purchasable = new Map<string, boolean>();

    for (const item of data.items) {
      const { temporal, supply, gating } = item.state;
      const { maxSelectable } = item.commercial;

      const canPurchase = (
        temporal.phase === "during" &&
        supply.status === "available" &&
        (!gating.required || gating.satisfied) &&
        maxSelectable > 0
      );

      purchasable.set(item.product.id, canPurchase);
    }

    return purchasable;
  });

  // Per-item CTA
  export const itemCTAAtom = atom((get) => {
    const data = get(panelDataAtom);
    const presentations = get(itemPresentationAtom);
    const purchasable = get(itemPurchasabilityAtom);

    if (!data) return new Map();

    const ctas = new Map<string, { kind: string; enabled: boolean }>();

    for (const item of data.items) {
      const id = item.product.id;
      const presentation = presentations.get(id);
      const isPurchasable = purchasable.get(id);

      // Gate precedence
      if (presentation === "locked") {
        ctas.set(id, { kind: "none", enabled: false });
        continue;
      }

      // Purchasable
      if (isPurchasable) {
        ctas.set(id, {
          kind: "quantity",
          enabled: item.commercial.maxSelectable > 0
        });
        continue;
      }

      // Waitlist
      if (item.state.supply.status === "none" && item.state.demand.kind === "waitlist") {
        ctas.set(id, { kind: "waitlist", enabled: true });
        continue;
      }

      // Notify me
      if (item.state.temporal.phase === "before" && item.state.demand.kind === "notify_me") {
        ctas.set(id, { kind: "notify", enabled: true });
        continue;
      }

      // Default: none
      ctas.set(id, { kind: "none", enabled: false });
    }

    return ctas;
  });

  // Panel-level action button state
  export const panelActionButtonAtom = atom((get) => {
    const data = get(panelDataAtom);
    const purchasable = get(itemPurchasabilityAtom);
    const selections = get(selectionAtom);

    if (!data) return { kind: "checkout", enabled: false, label: "Continue" };

    // Check if any visible item is purchasable
    const anyPurchasable = Array.from(purchasable.values()).some(p => p);

    if (anyPurchasable) {
      // Valid selection?
      const hasSelection = selections.size > 0;
      const meetsOrderRules = validateOrderRules(data.context.orderRules, selections, data.items);

      return {
        kind: "checkout",
        enabled: hasSelection && meetsOrderRules,
        label: data.context.clientCopy?.panel_action_button_cta_plural || "Get Tickets",
      };
    }

    // All non-purchasable: check for waitlist
    const hasWaitlist = data.items.some(item =>
      item.state.demand.kind === "waitlist" &&
      !item.state.gating.required // Respects gating precedence
    );

    if (hasWaitlist) {
      return {
        kind: "waitlist",
        enabled: true,
        label: "Join Waitlist",
      };
    }

    // Check for notify_me
    const hasNotify = data.items.some(item =>
      item.state.temporal.phase === "before" &&
      item.state.demand.kind === "notify_me"
    );

    if (hasNotify) {
      return {
        kind: "notify_me",
        enabled: true,
        label: "Notify Me",
      };
    }

    // Default: disabled checkout
    return {
      kind: "checkout",
      enabled: false,
      label: data.context.clientCopy?.panel_action_button_cta_plural || "Get Tickets",
    };
  });

  // Access code CTA visibility
  export const accessCodeCTAAtom = atom((get) => {
    const data = get(panelDataAtom);
    if (!data) return false;

    // Show if hidden items exist
    if (data.context.gatingSummary?.hasHiddenGatedItems) {
      return true;
    }

    // Or if any visible item is locked
    const presentations = get(itemPresentationAtom);
    return Array.from(presentations.values()).some(p => p === "locked");
  });

  3.3 Selection State Management

  // Actions for updating selection
  export const updateSelectionAtom = atom(
    null, // No read
    (get, set, update: { productId: string; quantity: number }) => {
      const current = new Map(get(selectionAtom));

      if (update.quantity === 0) {
        current.delete(update.productId);
      } else {
        current.set(update.productId, update.quantity);
      }

      set(selectionAtom, current);

      // Trigger server refresh (debounced)
      refreshPricing();
    }
  );

  // Debounced pricing refresh
  let refreshTimer: NodeJS.Timeout;
  function refreshPricing() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      // POST to server with current selections
      // Server returns updated payload with new pricing + maxSelectable
    }, 300);
  }

  Rule: Any selection change MUST trigger server refresh to update pricing and maxSelectable for dependencies.

  3.4 Message Resolution

  // Resolve message text (either direct text or via template)
  export function resolveMessage(
    message: z.infer<typeof MessageSchema>,
    templates: z.infer<typeof ContextSchema>["copyTemplates"]
  ): string | null {
    // Use direct text if provided
    if (message.text) {
      return message.text;
    }

    // Find template by code
    const template = templates?.find(t => t.key === message.code);
    if (!template) {
      return null; // Omit message
    }

    // Interpolate params
    let result = template.template;
    if (message.params) {
      for (const [key, value] of Object.entries(message.params)) {
        result = result.replace(`{${key}}`, String(value ?? ""));
      }
    }

    // Replace unknown placeholders with empty string
    result = result.replace(/\{[^}]+\}/g, "");

    return result;
  }

  Rule: Messages without text or matching template are omitted.

  ---
  4. Component Structure

  4.1 Component Hierarchy

  <ProductPanel>
    ├─ <PanelHeader>
    │   └─ Welcome text / event info
    ├─ <PanelNoticeArea>
    │   └─ <PanelNotice> × N (sorted by priority)
    ├─ <PanelContent>
    │   ├─ <Section> × N
    │   │   └─ <ItemRow> × N
    │   │       ├─ <ItemHeader>
    │   │       │   ├─ Name, badges
    │   │       │   └─ Messages (under_title)
    │   │       ├─ <ItemPrice>
    │   │       │   └─ Price display or mask
    │   │       ├─ <ItemQuantity>
    │   │       │   ├─ Stepper or select
    │   │       │   └─ Messages (under_quantity)
    │   │       └─ <ItemCTA>
    │   │           └─ Quantity control or waitlist button
    │   └─ <AccessCodeCTA> (if needed)
    ├─ <PricingFooter>
    │   └─ Line items from server
    └─ <PanelActionButton>
        └─ Main checkout/waitlist/notify button

  4.2 ProductPanel (Container)

  export function ProductPanel() {
    const { data, isLoading, error } = usePanelData();
    const [panelData, setPanelData] = useAtom(panelDataAtom);

    // Sync server data to atom on load/change
    useEffect(() => {
      if (data) {
        setPanelData(data);
      }
    }, [data, setPanelData]);

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (!data) return null;

    return (
      <div className="product-panel">
        <PanelHeader welcomeText={data.context.welcomeText} />
        <PanelNoticeArea notices={data.context.panelNotices} />
        <PanelContent
          sections={data.sections}
          items={data.items}
          context={data.context}
        />
        <AccessCodeCTA />
        <PricingFooter pricing={data.pricing} />
        <PanelActionButton />
      </div>
    );
  }

  4.3 PanelNoticeArea

  type PanelNotice = z.infer<typeof PanelNoticeSchema>;

  export function PanelNoticeArea({ notices }: { notices: PanelNotice[] }) {
    // Sort by descending priority
    const sorted = [...notices].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return (
      <div className="panel-notice-area">
        {sorted.map((notice, idx) => (
          <PanelNotice key={idx} notice={notice} />
        ))}
      </div>
    );
  }

  function PanelNotice({ notice }: { notice: PanelNotice }) {
    // Specialized rendering for access code entry
    if (notice.code === "requires_code_entry") {
      return (
        <div className={`notice notice-${notice.variant ?? "info"}`}>
          {notice.icon && <Icon name={notice.icon} />}
          <div>
            {notice.title && <h3>{notice.title}</h3>}
            {notice.description && <p>{notice.description}</p>}
            <AccessCodeForm />
          </div>
        </div>
      );
    }

    // Standard notice
    return (
      <div className={`notice notice-${notice.variant ?? "info"}`}>
        {notice.icon && <Icon name={notice.icon} />}
        <div>
          {notice.title && <h3>{notice.title}</h3>}
          {notice.text && <p>{notice.text}</p>}
          {notice.description && <p className="text-muted">{notice.description}</p>}
        </div>
        {notice.action && (
          <Button onClick={() => handleNoticeAction(notice.action!)}>
            {notice.action.label}
          </Button>
        )}
      </div>
    );
  }

  4.4 PanelContent & Sections

  export function PanelContent({
    sections,
    items,
    context
  }: {
    sections: z.infer<typeof SectionsSchema>;
    items: z.infer<typeof ItemsSchema>;
    context: z.infer<typeof ContextSchema>;
  }) {
    // Group items by section
    const itemsBySection = new Map<string, typeof items>();

    for (const item of items) {
      const sectionId = item.display.sectionId ?? sections[0]?.id;
      if (!itemsBySection.has(sectionId)) {
        itemsBySection.set(sectionId, []);
      }
      itemsBySection.get(sectionId)!.push(item);
    }

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    return (
      <div className="panel-content">
        {sortedSections.map(section => {
          const sectionItems = itemsBySection.get(section.id) ?? [];

          // Hide empty sections
          if (sectionItems.length === 0) return null;

          return (
            <Section
              key={section.id}
              section={section}
              items={sectionItems}
              context={context}
            />
          );
        })}
      </div>
    );
  }

  function Section({
    section,
    items,
    context
  }: {
    section: z.infer<typeof SectionSchema>;
    items: z.infer<typeof ItemSchema>[];
    context: z.infer<typeof ContextSchema>;
  }) {
    return (
      <div className="section" data-section-id={section.id}>
        <h2>{section.labelOverride ?? section.label}</h2>
        <div className="section-items">
          {items.map(item => (
            <ItemRow key={item.product.id} item={item} context={context} />
          ))}
        </div>
      </div>
    );
  }

  4.5 ItemRow

  type Item = z.infer<typeof ItemSchema>;

  export function ItemRow({ item, context }: { item: Item; context: Context }) {
    const presentations = useAtomValue(itemPresentationAtom);
    const purchasable = useAtomValue(itemPurchasabilityAtom);
    const ctas = useAtomValue(itemCTAAtom);
    const [selection, updateSelection] = useAtom(selectionAtom);

    const presentation = presentations.get(item.product.id);
    const isPurchasable = purchasable.get(item.product.id);
    const cta = ctas.get(item.product.id);
    const currentQty = selection.get(item.product.id) ?? 0;

    const isLocked = presentation === "locked";

    // Derive visibility flags
    const showQuantity = !isLocked && isPurchasable && item.commercial.maxSelectable > 0;
    const showPrice = isPurchasable && !isLocked;
    const maskPrice = isLocked;

    return (
      <div className={`item-row ${isLocked ? "locked" : ""}`}>
        <ItemHeader
          item={item}
          context={context}
          messages={filterMessagesByPlacement(item.state.messages, "row.under_title")}
        />

        <ItemPrice
          price={item.commercial.price}
          feesIncluded={item.commercial.feesIncluded}
          show={showPrice}
          mask={maskPrice}
        />

        {showQuantity && (
          <ItemQuantity
            productId={item.product.id}
            currentQty={currentQty}
            maxSelectable={item.commercial.maxSelectable}
            onUpdate={(qty) => updateSelection({ productId: item.product.id, quantity: qty })}
            messages={filterMessagesByPlacement(item.state.messages, "row.under_quantity")}
          />
        )}

        <ItemCTA
          cta={cta}
          item={item}
          context={context}
        />
      </div>
    );
  }

  4.6 ItemQuantity

  function ItemQuantity({
    productId,
    currentQty,
    maxSelectable,
    onUpdate,
    messages,
  }: {
    productId: string;
    currentQty: number;
    maxSelectable: number;
    onUpdate: (qty: number) => void;
    messages: Message[];
  }) {
    // UI variant based on maxSelectable
    const variant = maxSelectable === 1 ? "select" : "stepper";

    if (variant === "select") {
      return (
        <div className="item-quantity-select">
          <button
            onClick={() => onUpdate(currentQty === 0 ? 1 : 0)}
            className={currentQty > 0 ? "selected" : ""}
          >
            {currentQty > 0 ? "Added" : "Add"}
          </button>
          {messages.map((msg, idx) => (
            <MessageDisplay key={idx} message={msg} />
          ))}
        </div>
      );
    }

    return (
      <div className="item-quantity-stepper">
        <button
          onClick={() => onUpdate(Math.max(0, currentQty - 1))}
          disabled={currentQty === 0}
        >
          −
        </button>
        <span>{currentQty}</span>
        <button
          onClick={() => onUpdate(Math.min(maxSelectable, currentQty + 1))}
          disabled={currentQty >= maxSelectable}
        >
          +
        </button>
        {messages.map((msg, idx) => (
          <MessageDisplay key={idx} message={msg} />
        ))}
      </div>
    );
  }

  4.7 PricingFooter

  export function PricingFooter({ pricing }: { pricing: z.infer<typeof PricingSchema> }) {
    // Empty state: no selection
    if (pricing.lineItems.length === 0) {
      return null;
    }

    return (
      <div className="pricing-footer">
        {pricing.lineItems.map((line, idx) => {
          const isTotal = line.code === "TOTAL";

          return (
            <div
              key={idx}
              className={`price-line ${isTotal ? "total" : ""}`}
            >
              <span className="label">{line.label}</span>
              <span className="amount">{formatDinero(line.amount)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  Rule: Render line items in exact payload order. Never reorder or insert computed rows.

  4.8 PanelActionButton

  export function PanelActionButton() {
    const buttonState = useAtomValue(panelActionButtonAtom);

    const handleClick = () => {
      switch (buttonState.kind) {
        case "checkout":
          // Navigate to checkout with current selections
          break;
        case "waitlist":
          // Open waitlist signup modal
          break;
        case "notify_me":
          // Open notify-me modal
          break;
      }
    };

    return (
      <button
        className={`panel-action-button panel-action-${buttonState.kind}`}
        disabled={!buttonState.enabled}
        onClick={handleClick}
      >
        {buttonState.label}
      </button>
    );
  }

  4.9 AccessCodeCTA

  export function AccessCodeCTA() {
    const showAccessCode = useAtomValue(accessCodeCTAAtom);
    const [expanded, setExpanded] = useState(false);

    if (!showAccessCode) return null;

    return (
      <div className="access-code-cta">
        {!expanded ? (
          <button onClick={() => setExpanded(true)}>
            🔒 Have an access code? Enter it here
          </button>
        ) : (
          <AccessCodeForm onCancel={() => setExpanded(false)} />
        )}
      </div>
    );
  }

  function AccessCodeForm({ onCancel }: { onCancel?: () => void }) {
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        // POST to server
        const response = await fetch("/api/panel/unlock", {
          method: "POST",
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          const newPayload = await response.json();
          // Validate and update panelDataAtom
          const validated = PanelDataSchema.parse(newPayload);
          setPanelData(validated);
          setCode("");
        } else {
          // Error handling: server returns updated payload with error notice
          const errorPayload = await response.json();
          const validated = PanelDataSchema.parse(errorPayload);
          setPanelData(validated);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="access-code-form">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter access code"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || !code}>
          {isSubmitting ? "Applying..." : "Apply Code"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>Cancel</button>
        )}
      </form>
    );
  }

  ---
  5. Rendering Logic

  5.1 Presentation State Derivation

  Decision Table:

  | Condition                                                       | Presentation                     |
  |-----------------------------------------------------------------|----------------------------------|
  | gating.required && !satisfied && listingPolicy="visible_locked" | locked                           |
  | All other cases                                                 | normal                           |
  | Item with listingPolicy="omit_until_unlocked" and unsatisfied   | Not in items[] (server omission) |

  Implementation:

  function derivePresentation(item: Item): "normal" | "locked" {
    const { gating } = item.state;

    if (gating.required && !gating.satisfied && gating.listingPolicy === "visible_locked") {
      return "locked";
    }

    return "normal";
  }

  5.2 Purchasability Rules

  Formula: All four conditions must be true.

  function isPurchasable(item: Item): boolean {
    const { temporal, supply, gating } = item.state;
    const { maxSelectable } = item.commercial;

    return (
      temporal.phase === "during" &&
      supply.status === "available" &&
      (!gating.required || gating.satisfied) &&
      maxSelectable > 0
    );
  }

  Truth Table:

  | temporal.phase | supply.status | Gate OK? | maxSelectable | isPurchasable      |
  |----------------|---------------|----------|---------------|--------------------|
  | during         | available     | ✅        | > 0           | true               |
  | before         | available     | ✅        | > 0           | false (wrong time) |
  | during         | none          | ✅        | > 0           | false (no stock)   |
  | during         | available     | ❌        | > 0           | false (locked)     |
  | during         | available     | ✅        | 0             | false (clamp)      |

  5.3 CTA Selection

  Decision Flow (first match wins):

  function selectCTA(item: Item, presentation: Presentation): CTA {
    // 1. Gate precedence
    if (presentation === "locked") {
      return { kind: "none" };
    }

    // 2. Purchasable → quantity control
    if (isPurchasable(item)) {
      return {
        kind: "quantity",
        enabled: item.commercial.maxSelectable > 0
      };
    }

    // 3. Sold out + waitlist
    if (item.state.supply.status === "none" && item.state.demand.kind === "waitlist") {
      return { kind: "waitlist", enabled: true };
    }

    // 4. Before sale + notify
    if (item.state.temporal.phase === "before" && item.state.demand.kind === "notify_me") {
      return { kind: "notify", enabled: true };
    }

    // 5. Default: none
    return { kind: "none" };
  }

  5.4 Price & Quantity Visibility

  Price UI:

  | Presentation | isPurchasable | Price UI                  |
  |--------------|---------------|---------------------------|
  | locked       | —             | masked ("—" or "Locked")  |
  | normal       | true          | shown (formatted amount)  |
  | normal       | false         | hidden (no price element) |

  Quantity UI:

  | Presentation | isPurchasable | maxSelectable | Quantity UI            |
  |--------------|---------------|---------------|------------------------|
  | locked       | —             | —             | hidden                 |
  | normal       | false         | —             | hidden                 |
  | normal       | true          | 1             | select (single toggle) |
  | normal       | true          | > 1           | stepper (+/− buttons)  |

  Implementation:

  function deriveVisibility(item: Item, presentation: Presentation, isPurchasable: boolean) {
    const isLocked = presentation === "locked";

    return {
      priceUI: isLocked ? "masked" : (isPurchasable ? "shown" : "hidden"),
      quantityUI: (isLocked || !isPurchasable || item.commercial.maxSelectable === 0)
        ? "hidden"
        : (item.commercial.maxSelectable === 1 ? "select" : "stepper"),
    };
  }

  5.5 Message Display & Priority

  Rules:
  1. Filter by placement (e.g., "row.under_title")
  2. Sort by descending priority (higher first)
  3. Resolve text via message.text or template interpolation
  4. Omit if no text can be resolved

  Implementation:

  function filterAndSortMessages(
    messages: Message[],
    placement: string,
    templates: CopyTemplate[]
  ): ResolvedMessage[] {
    return messages
      .filter(m => m.placement === placement)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .map(m => ({
        ...m,
        resolvedText: resolveMessage(m, templates),
      }))
      .filter(m => m.resolvedText !== null);
  }

  Example: Displaying messages under quantity

  <div className="item-quantity">
    <QuantityStepper {...props} />
    <div className="messages">
      {filterAndSortMessages(item.state.messages, "row.under_quantity", context.copyTemplates)
        .map((msg, idx) => (
          <div key={idx} className={`message message-${msg.variant ?? "info"}`}>
            {msg.resolvedText}
          </div>
        ))}
    </div>
  </div>

  ---
  6. User Interactions

  6.1 Quantity Selection Flow

  User clicks +/− or "Add"
    ↓
  Update selectionAtom locally (immediate UI feedback)
    ↓
  Debounce 300ms
    ↓
  POST to server with full selection map
    ↓
  Server recalculates:
    - pricing (fees, taxes, total)
    - maxSelectable for all items (stock, limits, add-on dependencies)
    ↓
  Server responds with updated payload
    ↓
  Validate payload
    ↓
  Update panelDataAtom
    ↓
  Atoms re-derive UI state
    ↓
  React re-renders

  Key Points:
  - Optimistic update for instant feedback
  - Server is source of truth; client never computes limits
  - If server returns lower maxSelectable, clamp selection down

  Clamp-down logic:

  useEffect(() => {
    const data = panelDataAtom;
    if (!data) return;

    const currentSelection = get(selectionAtom);
    const needsClamp = new Map<string, number>();

    for (const [productId, qty] of currentSelection.entries()) {
      const item = data.items.find(i => i.product.id === productId);
      if (!item) continue;

      if (qty > item.commercial.maxSelectable) {
        needsClamp.set(productId, item.commercial.maxSelectable);
      }
    }

    if (needsClamp.size > 0) {
      const updated = new Map(currentSelection);
      for (const [id, clampedQty] of needsClamp.entries()) {
        if (clampedQty === 0) {
          updated.delete(id);
        } else {
          updated.set(id, clampedQty);
        }
      }
      set(selectionAtom, updated);
    }
  }, [panelDataAtom]);

  6.2 Access Code Submission Flow

  User enters code and clicks "Apply Code"
    ↓
  Client POSTs to /api/panel/unlock with { code }
    ↓
  Server validates code (signature, expiry, usage limits)
    ↓
  ─────────────────────────────────────────
  │ SUCCESS                               │
  │ Server returns updated payload:       │
  │ - Previously omitted items now in     │
  │   items[] with gating.satisfied=true  │
  │ - Or visible_locked items unlocked    │
  │ - gatingSummary updated               │
  │ - Panel notices may change            │
  ─────────────────────────────────────────
    ↓
  ─────────────────────────────────────────
  │ ERROR                                 │
  │ Server returns payload with error:    │
  │ - panelNotices includes error notice  │
  │   (code: "invalid_code", variant:     │
  │   "error", text: "Invalid...")        │
  │ - Items remain locked/omitted         │
  ─────────────────────────────────────────
    ↓
  Validate payload
    ↓
  Update panelDataAtom
    ↓
  UI re-renders (success: new items; error: error banner)

  Important: Client NEVER validates codes locally. Server is authoritative.

  6.3 Waitlist & Notify-Me Actions

  Waitlist:

  async function handleWaitlistSignup(productId: string) {
    // POST to waitlist endpoint
    await fetch("/api/waitlist/join", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });

    // Show confirmation modal
    showModal("You're on the waitlist! We'll email you if tickets become available.");
  }

  Notify-Me:

  async function handleNotifyMe(productId: string) {
    // POST to notify endpoint
    await fetch("/api/notify/subscribe", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });

    // Show confirmation
    showModal("We'll email you when tickets go on sale!");
  }

  6.4 Checkout Submission

  async function handleCheckout() {
    const selections = get(selectionAtom);
    const data = get(panelDataAtom);

    // Validate order rules client-side (for UX)
    const validation = validateOrderRules(data.context.orderRules, selections, data.items);

    if (!validation.valid) {
      showError(validation.message); // From clientCopy
      return;
    }

    // Submit to checkout endpoint
    const response = await fetch("/api/checkout/create", {
      method: "POST",
      body: JSON.stringify({
        selections: Array.from(selections.entries()).map(([id, qty]) => ({ id, qty })),
      }),
    });

    if (response.ok) {
      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } else {
      // Server validation failed (stock changed, etc.)
      const error = await response.json();
      showError(error.message);
    }
  }

  Order Rules Validation:

  function validateOrderRules(
    rules: OrderRules,
    selections: Map<string, number>,
    items: Item[]
  ): { valid: boolean; message?: string } {
    const selectedItems = items.filter(item => selections.has(item.product.id));

    // Count types selected
    const typesSelected = new Set(selectedItems.map(i => i.product.type)).size;

    if (typesSelected < rules.minSelectedTypes) {
      return {
        valid: false,
        message: `Please select at least ${rules.minSelectedTypes} ticket type(s).`,
      };
    }

    // Check min per type
    for (const item of selectedItems) {
      const qty = selections.get(item.product.id) ?? 0;
      if (qty < rules.minTicketsPerSelectedType) {
        return {
          valid: false,
          message: `Minimum ${rules.minTicketsPerSelectedType} ticket(s) required for ${item.product.name}.`,
        };
      }
    }

    return { valid: true };
  }

  ---
  7. Edge Cases & Testing

  7.1 What Client MUST NEVER Do

  Prohibited Actions:

  // ❌ NEVER compute schedules
  const isOnSale = new Date() >= new Date(item.temporal.currentWindow.startsAt);

  // ❌ NEVER derive availability from counts
  const isSoldOut = item.supply.remaining === 0;

  // ❌ NEVER compute price math
  const total = selections.reduce((sum, [id, qty]) => {
    const item = items.find(i => i.product.id === id);
    return sum + (item.commercial.price.amount * qty);
  }, 0);

  // ❌ NEVER derive limits from fields
  const effectiveMax = Math.min(
    item.commercial.limits.perOrder ?? Infinity,
    item.supply.remaining ?? Infinity
  );

  // ❌ NEVER validate codes locally
  if (accessCode.length < 6) return "Code too short";

  // ❌ NEVER invent UI text
  if (item.state.supply.status === "none") {
    return "Sold Out"; // Use state.messages[] instead
  }

  Correct Patterns:

  // ✅ Use server-provided phase
  const isOnSale = item.state.temporal.phase === "during";

  // ✅ Use server-provided status
  const isSoldOut = item.state.supply.status === "none";

  // ✅ Use server-provided pricing
  const footer = <PricingFooter pricing={data.pricing} />;

  // ✅ Use server-provided clamp
  const max = item.commercial.maxSelectable;

  // ✅ Submit codes to server
  const response = await fetch("/api/panel/unlock", { body: { code } });

  // ✅ Use server-provided text
  const message = resolveMessage(item.state.messages[0], templates);

  7.2 Common Edge Cases

  Case 1: Unlocked but Sold Out

  {
    "state": {
      "gating": { "required": true, "satisfied": true },
      "supply": { "status": "none" },
      "demand": { "kind": "waitlist" }
    },
    "commercial": { "maxSelectable": 0 }
  }

  Expected:
  - Row is visible (unlocked)
  - Presentation = normal
  - Price is hidden (not purchasable)
  - Quantity UI hidden
  - CTA = waitlist (demand takes over)
  - Message: "Sold Out" (from state.messages[])

  Case 2: Public Sold Out + Hidden Gated

  {
    "items": [
      {
        "product": { "id": "ga", "name": "General Admission" },
        "state": { "supply": { "status": "none" } }
      }
    ],
    "context": {
      "gatingSummary": { "hasHiddenGatedItems": true }
    }
  }

  Expected:
  - Show access code CTA prominently
  - Do NOT show "Event Sold Out" final state
  - After unlock, if hidden items also sold out, THEN show "Event Sold Out"

  Case 3: Add-on Without Parent

  {
    "product": { "id": "parking", "name": "Parking Pass" },
    "relations": { "parentProductIds": ["ga", "vip"] },
    "commercial": { "maxSelectable": 0 }
  }

  Expected:
  - Quantity UI hidden (maxSelectable = 0)
  - Show message: "Add at least one ticket to select this add-on" (from clientCopy)
  - After parent selected → server refresh → maxSelectable updates → UI enables

  Case 4: Stale Data (Fetch Error)

  // Last valid pricing displayed with indicator
  <PricingFooter pricing={lastValidPricing} />
  <div className="pricing-stale-indicator">
    ⚠️ Prices may be outdated
    <button onClick={retryPricingFetch}>Retry</button>
  </div>

  7.3 Testing Strategy

  Unit Tests (Atoms & Logic):

  describe("itemPurchasabilityAtom", () => {
    it("returns true when all axes allow", () => {
      const mockData = {
        items: [{
          product: { id: "1" },
          state: {
            temporal: { phase: "during" },
            supply: { status: "available" },
            gating: { required: false, satisfied: true },
          },
          commercial: { maxSelectable: 5 },
        }],
      };

      const result = testAtom(itemPurchasabilityAtom, { panelData: mockData });
      expect(result.get("1")).toBe(true);
    });

    it("returns false when temporal phase is before", () => {
      const mockData = {
        items: [{
          product: { id: "1" },
          state: {
            temporal: { phase: "before" }, // ❌
            supply: { status: "available" },
            gating: { required: false, satisfied: true },
          },
          commercial: { maxSelectable: 5 },
        }],
      };

      const result = testAtom(itemPurchasabilityAtom, { panelData: mockData });
      expect(result.get("1")).toBe(false);
    });

    // Test all four axes independently
  });

  Integration Tests (Component Rendering):

  describe("ItemRow", () => {
    it("shows quantity controls when purchasable", () => {
      const item = createMockItem({
        isPurchasable: true,
        maxSelectable: 5
      });

      render(<ItemRow item={item} context={mockContext} />);

      expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "−" })).toBeInTheDocument();
    });

    it("masks price when locked", () => {
      const item = createMockItem({
        gating: { required: true, satisfied: false, listingPolicy: "visible_locked" },
      });

      render(<ItemRow item={item} context={mockContext} />);

      expect(screen.queryByText("$50.00")).not.toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument(); // Masked
    });
  });

  E2E Tests (User Flows):

  describe("Access code unlock flow", () => {
    it("unlocks hidden items when valid code entered", async () => {
      // Initial: hidden items
      mockApiResponse("/api/panel", {
        items: [],
        context: { gatingSummary: { hasHiddenGatedItems: true } },
      });

      render(<ProductPanel />);

      // Enter code
      await user.type(screen.getByPlaceholderText("Enter access code"), "VALID123");
      await user.click(screen.getByText("Apply Code"));

      // Mock successful unlock response
      mockApiResponse("/api/panel/unlock", {
        items: [{ product: { id: "vip", name: "VIP" } }],
        context: { gatingSummary: { hasHiddenGatedItems: false } },
      });

      // Verify new item appears
      await waitFor(() => {
        expect(screen.getByText("VIP")).toBeInTheDocument();
      });
    });
  });

  Fixture Tests (Canonical States):

  Create fixtures for each major state combination:

  1. fixture-available.json — On sale, stock available
  2. fixture-sold-out-waitlist.json — Sold out with waitlist
  3. fixture-visible-locked.json — Gated item (visible, locked)
  4. fixture-omit-until-unlock.json — Hidden gated items
  5. fixture-public-sold-hidden-gated.json — Public sold out + hidden stock
  6. fixture-payment-plan.json — Payment plans available

  Load each fixture and verify UI renders correctly per spec.

  ---
  8. Quick Reference

  8.1 Purchasability Formula (One-Liner)

  isPurchasable =
    temporal.phase === "during" &&
    supply.status === "available" &&
    (!gating.required || gating.satisfied) &&
    maxSelectable > 0;

  8.2 CTA Decision Tree

  presentation === "locked"?
    → none

  isPurchasable?
    → quantity (enabled if maxSelectable > 0)

  supply.status === "none" && demand.kind === "waitlist"?
    → waitlist

  temporal.phase === "before" && demand.kind === "notify_me"?
    → notify
    
  else:
    → none

  8.3 Price/Quantity Visibility Matrix

  | Locked? | Purchasable? | Price  | Quantity       |
  |---------|--------------|--------|----------------|
  | ✅       | —            | Masked | Hidden         |
  | ❌       | ✅            | Shown  | Select/Stepper |
  | ❌       | ❌            | Hidden | Hidden         |

  8.4 Machine Code Cheat Sheet

  Common reasons[] codes (snake_case):

  - Temporal: outside_window, sales_ended
  - Supply: sold_out, low_stock
  - Gating: requires_code, requires_membership
  - Demand: waitlist_available, notify_enabled

  Common messages[].code:

  - sold_out, remaining_low, requires_code, on_sale_at, sales_ended

  8.5 Key Atoms Reference

  | Atom                   | Purpose                | Returns                      |
  |------------------------|------------------------|------------------------------|
  | panelDataAtom          | Server payload         | PanelData | null             |
  | selectionAtom          | User selections        | Map<productId, qty>          |
  | itemPresentationAtom   | Locked/normal per item | Map<productId, Presentation> |
  | itemPurchasabilityAtom | Can buy? per item      | Map<productId, boolean>      |
  | itemCTAAtom            | CTA kind per item      | Map<productId, CTA>          |
  | panelActionButtonAtom  | Main button state      | { kind, enabled, label }     |
  | accessCodeCTAAtom      | Show unlock UI?        | boolean                      |

  8.6 Server Refresh Triggers

  Client MUST refresh payload when:

  - User changes any item quantity
  - User enters/applies access code
  - User applies discount code
  - Server pushes update (WebSocket/SSE)
  - Time-based transition (if using polling)

  Client MUST NOT refresh on:

  - Pure UI interactions (expand/collapse, hover)
  - Client validation errors
  - Rendering events

  8.7 Validation Checklist

  Before rendering, ensure:

  - Root payload has exactly 4 keys: context, sections, items, pricing
  - All product.id are unique
  - All commercial.price.currency.code match pricing.currency.code
  - No items with listingPolicy="omit_until_unlocked" and unsatisfied gates
  - All messages[].placement are valid enum values
  - All money is Dinero snapshots (no raw numbers)
  - Sections array has at least one element

  8.8 Accessibility Requirements

  - All form fields have accessible labels
  - Validation errors announced with role="alert"
  - No positive tabIndex values
  - Semantic HTML elements used (not div with role)
  - Images have meaningful alt text
  - Keyboard navigation works for all controls

  8.9 Performance Patterns

  Debouncing:
  // Quantity changes debounced 300ms before server call
  const debouncedRefresh = debounce(refreshPricing, 300);

  Optimistic Updates:
  // Update selection atom immediately for instant feedback
  updateSelection({ productId, quantity });
  // Then refresh from server (debounced)

  Loading States:
  // Keep displaying previous pricing during refresh
  // Show subtle "updating" indicator if > 500ms
  // Never flash empty state

  8.10 Error Handling Patterns

  Validation Errors (strict mode):
  try {
    const validated = PanelDataSchema.parse(serverData);
  } catch (error) {
    console.error("Validation failed:", error.format());
    throw new Error("Invalid panel data");
  }

  Currency Mismatch (fatal):
  if (item.commercial.price.currency.code !== pricing.currency.code) {
    throw new Error("Currency mismatch detected");
  }

  Fetch Errors (graceful):
  // Keep last valid state, show retry button
  <PricingFooter pricing={lastValidPricing} />
  {isStale && <RetryButton onClick={refetch} />}

  ---
  Appendix: Complete Type Definitions

  // All schemas exported as TypeScript types
  export type PanelData = z.infer<typeof PanelDataSchema>;
  export type Context = z.infer<typeof ContextSchema>;
  export type Section = z.infer<typeof SectionSchema>;
  export type Item = z.infer<typeof ItemSchema>;
  export type Product = Item["product"];
  export type ItemState = Item["state"];
  export type Commercial = Item["commercial"];
  export type Display = Item["display"];
  export type Pricing = z.infer<typeof PricingSchema>;
  export type DineroSnapshot = z.infer<typeof DineroSnapshotSchema>;
  export type Message = ItemState["messages"][number];
  export type PanelNotice = Context["panelNotices"][number];
  export type OrderRules = Context["orderRules"];

  // Derived UI states
  export type Presentation = "normal" | "locked";
  export type PriceUI = "hidden" | "masked" | "shown";
  export type QuantityUI = "hidden" | "select" | "stepper";
  export type CTA = {
    kind: "none" | "quantity" | "waitlist" | "notify";
    enabled?: boolean;
  };
  export type PanelActionButton = {
    kind: "checkout" | "waitlist" | "notify_me";
    enabled: boolean;
    label: string;
  };

  ---
  Summary Checklist

  Before shipping, verify:

  - All Zod schemas match spec exactly
  - Atoms use only server data (no local business logic)
  - Components render server text verbatim (no invented strings)
  - Price visibility follows strict rules (hidden when not purchasable)
  - Quantity UI enforces only maxSelectable (never other fields)
  - Access code submission goes to server (no client validation)
  - Pricing footer renders line items in exact order
  - Currency consistency validated on every payload
  - All money formatted via Dinero utils or snapshot math
  - No client-side price/fee/tax/total calculations
  - Gating precedence respected (locked items show no demand CTAs)
  - Selection changes trigger debounced server refresh
  - Error states handled gracefully (stale data, validation fails)
  - Tests cover all four axes independently
  - Fixtures exist for all major state combinations

  ---
  End of Implementation Guide

  For spec details, see: product-panel-spec.mdFor rule checklist, see: product-panel-spec-rules.md

  