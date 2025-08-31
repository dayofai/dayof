import type { Schema } from '@effect/schema/Schema';
import { decodeUnknown } from '@effect/schema/Schema';
import { provide, runPromise } from 'effect/Effect';
import type { EffectType } from '../runtime';
import { AppLayer } from '../runtime';

type HandlerArgs = {
  event: { data: unknown };
  step: { run: <T>(name: string, f: () => Promise<T> | T) => Promise<T> };
};

export function effectHandler<A>(
  schema: Schema<A, unknown>,
  program: (input: A, ctx: HandlerArgs) => EffectType<unknown, never>
) {
  const parse = decodeUnknown(schema);
  return async ({ event, step }: HandlerArgs) => {
    const data = await runPromise(parse(event.data));
    const result = await step.run('effect', () =>
      runPromise(provide(program(data, { event, step }), AppLayer))
    );
    return result;
  };
}
