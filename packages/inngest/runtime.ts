import { NodeContext } from '@effect/platform-node';
import type { Effect } from 'effect/Effect';
import { mergeAll } from 'effect/Layer';

export const AppLayer = mergeAll(NodeContext.layer);

export type EffectType<A, E = unknown> = Effect<A, E>;
