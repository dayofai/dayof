import { String as SchemaString, Struct } from '@effect/schema/Schema';
import { succeed } from 'effect/Effect';
import { inngest } from '../client';
import { effectHandler } from '../handlers/effectHandler';

const ExampleEvent = Struct({
  userId: SchemaString,
  action: SchemaString,
});

export const exampleEffect = inngest.createFunction(
  { id: 'example-effect' },
  { event: 'example/effect' },
  effectHandler(ExampleEvent, (input) =>
    succeed({
      ok: true as const,
      message: `Processed ${input.action} by ${input.userId}`,
    })
  )
);
