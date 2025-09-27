// import { succeed } from 'effect/Effect';
// import { inngest } from '../client';
// import { ExampleEvent } from '../events';
// import { effectHandler } from '../handlers/effectHandler';

// export const exampleEffect = inngest.createFunction(
//   { id: 'example-effect' },
//   { event: 'example/effect' },
//   effectHandler(ExampleEvent, (input) =>
//     succeed({
//       ok: true as const,
//       message: `Processed ${input.action} by ${input.userId}`,
//     })
//   )
// );
