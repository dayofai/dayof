import { queryOptions } from '@tanstack/react-query';
import {
  DineroSnapshotSchema,
  MachineCodeSchema,
  type PanelData,
  type PanelItem,
  type Pricing,
  type Section,
} from '../schemas';

/**
 * Panel query options for TanStack Query
 *
 * @param eventId - Unique event identifier
 * @returns Query options suitable for prefetching in route loaders
 * @see {@link ../README.md} for full documentation and usage examples
 */
export function panelQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: ['panel', eventId] as const,
    queryFn: async (): Promise<PanelData> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/events/${eventId}/panel`);
      // return response.json();

      return getMockPanelData(eventId);
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Mock panel data generator
 *
 * Creates a minimal valid PanelData payload for development.
 * Uses schema parsing for DineroSnapshot to ensure branded types are correctly applied.
 */
function getMockPanelData(_eventId: string): PanelData {
  const currency = {
    code: 'USD',
    base: 10,
    exponent: 2,
  };

  // Parse DineroSnapshot for branded types
  const price = DineroSnapshotSchema.parse({
    amount: 2500,
    currency,
    scale: 2,
  });
  const zeroAmount = DineroSnapshotSchema.parse({
    amount: 0,
    currency,
    scale: 2,
  });

  const sections: Section[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      label: 'General Admission',
      order: 0,
    },
  ];

  const items: PanelItem[] = [
    {
      product: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'General Admission',
        type: 'ticket',
        category: 'general',
        description: 'Standard entry to the event',
      },
      state: {
        temporal: {
          phase: 'during',
          reasons: [],
        },
        supply: {
          status: 'available',
          remaining: 42,
          reasons: [],
        },
        gating: {
          required: false,
          satisfied: true,
          listingPolicy: 'visible_locked',
          reasons: [],
        },
        demand: {
          kind: 'none',
          reasons: [],
        },
        messages: [],
      },
      commercial: {
        price,
        feesIncluded: false,
        maxSelectable: 10,
        limits: {
          perOrder: 10,
        },
      },
      display: {
        badges: [
          { label: 'Featured', variant: 'primary' },
          { label: 'Limited', variant: 'warning' },
        ],
        sectionId: '550e8400-e29b-41d4-a716-446655440001',
        showLowRemaining: false,
      },
    },
  ];

  const pricing: Pricing = {
    currency,
    lineItems: [
      {
        code: 'TICKETS',
        label: 'Tickets',
        amount: zeroAmount,
      },
      {
        code: 'FEES',
        label: 'Service Fees',
        amount: zeroAmount,
      },
      {
        code: 'TOTAL',
        label: 'Total',
        amount: zeroAmount,
      },
    ],
  };

  return {
    context: {
      orderRules: {
        types: 'multiple',
        typesPerOrder: 'multiple',
        ticketsPerType: 'multiple',
        minSelectedTypes: 0,
        minTicketsPerSelectedType: 1,
      },
      effectivePrefs: {
        showTypeListWhenSoldOut: false,
        displayPaymentPlanAvailable: false,
      },
      panelNotices: [
        {
          code: MachineCodeSchema.parse('payment_plan_available'),
          variant: 'neutral',
          icon: 'info',
          title: 'Payment Plans Available',
          description: 'Split your purchase into installments at checkout.',
          priority: 50,
        },
        {
          code: MachineCodeSchema.parse('payment_plan_availables'),
          variant: 'warning',
          icon: 'info',
          title: 'Payment Plans Available',
          description: 'Split your purchase into installments at checkout.',
          priority: 90,
        },
      ],
      welcomeText: 'Welcome! Please choose your desired ticket type:',
      primaryCTA: {
        label: 'Checkout',
        action: 'checkout',
        enabled: false,
      },
    },
    sections,
    items,
    pricing,
  };
}
