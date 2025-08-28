# Zod 4

# Introducing Zod 4 beta

Refer to the [Changelog](https://v4.zod.dev/v4/changelog) for a complete list of breaking changes.

Zod 4 is now in beta after over a year of active development. It's faster, slimmer, more `tsc`-efficient, and implements some long-requested features.

To install the beta:

```
pnpm upgrade zod@next
```

Development will continue on the [`v4`](https://github.com/colinhacks/zod/tree/v4) branch over a 4-6 week beta period as I work with libraries to ensure day-one compatibility with the first stable release.

❤️

Huge thanks to [Clerk](https://go.clerk.com/zod-clerk), who supported my work on Zod 4 through their extremely generous [OSS Fellowship](https://clerk.com/blog/zod-fellowship). They were an amazing partner throughout the (much longer than anticipated!) development process.

## [Why a new major version?](https://v4.zod.dev/v4\#why-a-new-major-version)

Zod v3.0 was released in May 2021 (!). Back then Zod had 2700 stars on GitHub and 600k weekly downloads. Today it has 36.5k stars and 23M weekly downloads. After 24 minor versions, the Zod 3 codebase has hit a ceiling; the most commonly requested features and improvements require breaking changes.

Zod 4 implements all of these in one fell swoop. It uses an entirely new internal architecture that solves some long-standing design limitations, lays the groundwork for some long-requested features, and closes 9 of Zod's [10 most upvoted open issues](https://github.com/colinhacks/zod/issues?q=is%3Aissue%20state%3Aopen%20sort%3Areactions-%2B1-desc). With luck, it will serve as the new foundation for many more years to come.

For a scannable breakdown of what's new, see the table of contents. Click on any item to jump to that section.

## [Benchmarks](https://v4.zod.dev/v4\#benchmarks)

You can run these benchmarks yourself in the Zod repo:

```
$ git clone git@github.com:colinhacks/zod.git
$ cd zod
$ git switch v4
$ pnpm install
```

Then to run a particular benchmark:

```
$ pnpm bench <name>
```

### [2.6x faster string parsing](https://v4.zod.dev/v4\#26x-faster-string-parsing)

```
$ pnpm bench string
runtime: node v22.13.0 (arm64-darwin)

benchmark      time (avg)             (min … max)       p75       p99      p999
------------------------------------------------- -----------------------------
• z.string().parse
------------------------------------------------- -----------------------------
zod3          348 µs/iter       (299 µs … 743 µs)    362 µs    494 µs    634 µs
zod4          132 µs/iter       (108 µs … 348 µs)    162 µs    269 µs    322 µs

summary for z.string().parse
  zod4
   2.63x faster than zod3
```

### [3x faster array parsing](https://v4.zod.dev/v4\#3x-faster-array-parsing)

```
$ pnpm bench array
runtime: node v22.13.0 (arm64-darwin)

benchmark      time (avg)             (min … max)       p75       p99      p999
------------------------------------------------- -----------------------------
• z.array() parsing
------------------------------------------------- -----------------------------
zod3          162 µs/iter       (141 µs … 753 µs)    152 µs    291 µs    513 µs
zod4       54'282 ns/iter    (47'084 ns … 669 µs) 50'833 ns    185 µs    233 µs

summary for z.array() parsing
  zod4
   2.98x faster than zod3
```

### [7x faster object parsing](https://v4.zod.dev/v4\#7x-faster-object-parsing)

This runs the [Moltar validation library benchmark](https://moltar.github.io/typescript-runtime-type-benchmarks/).

```
$ pnpm bench object-moltar
benchmark      time (avg)             (min … max)       p75       p99      p999
------------------------------------------------- -----------------------------
• z.object() safeParse
------------------------------------------------- -----------------------------
zod3          767 µs/iter     (735 µs … 3'136 µs)    775 µs    898 µs  3'136 µs
zod4          110 µs/iter     (102 µs … 1'291 µs)    105 µs    217 µs    566 µs

summary for z.object() safeParse
  zod4
   6.98x faster than zod3
```

## [20x reduction in `tsc` instantiations](https://v4.zod.dev/v4\#20x-reduction-in-tsc-instantiations)

Consider the following simple file:

```
import * as z from "zod/v4";

export const A = z.object({
  a: z.string(),
  b: z.string(),
  c: z.string(),
  d: z.string(),
  e: z.string(),
});

export const B = A.extend({
  f: z.string(),
  g: z.string(),
  h: z.string(),
});
```

Compiling this file with `tsc --extendedDiagnostics` using `zod@3` results in >25000 type instantiations. With `zod@4` it only results in ~1100.

The Zod repo contains a `tsc` benchmarking playground. Try this for yourself using the compiler benchmarks in `packages/tsc`. The exact numbers may change as the implementation evolves.

```
$ cd packages/tsc
$ pnpm bench object-with-extend
```

More importantly, Zod 4 has redesigned and simplified the generics of `ZodObject` and other schema classes to avoid some pernicious "instantiation explosions". For instance, chaining `.extend()` and `.omit()` repeatedly—something that previously caused compiler issues:

```
import * as z from "zod/v4";

export const a = z.object({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const b = a.omit({
  a: true,
  b: true,
  c: true,
});

export const c = b.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const d = c.omit({
  a: true,
  b: true,
  c: true,
});

export const e = d.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const f = e.omit({
  a: true,
  b: true,
  c: true,
});

export const g = f.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const h = g.omit({
  a: true,
  b: true,
  c: true,
});

export const i = h.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const j = i.omit({
  a: true,
  b: true,
  c: true,
});

export const k = j.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const l = k.omit({
  a: true,
  b: true,
  c: true,
});

export const m = l.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const n = m.omit({
  a: true,
  b: true,
  c: true,
});

export const o = n.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const p = o.omit({
  a: true,
  b: true,
  c: true,
});

export const q = p.extend({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});
```

In Zod 3, this took `4000ms` to compile; and adding additional calls to `.extend()` would trigger a "Possibly infinite" error. In Zod 4, this compiles in `400ms`, `10x` faster.

Coupled with the upcoming [`tsgo`](https://github.com/microsoft/typescript-go) compiler, Zod 4's editor performance will scale to vastly larger schemas and codebases.

## [2x reduction in core bundle size](https://v4.zod.dev/v4\#2x-reduction-in-core-bundle-size)

Consider the following simple script.

```
import * as z from "zod/v4";

const schema = z.boolean();

schema.parse(true);
```

It's about as simple as it gets when it comes to validation. That's intentional; it's a good way to measure the _core bundle size_—the code that will end up in the bundle even in simple cases. We'll bundle this with `rollup` using both Zod 3 and Zod 4 and compare the final bundles.

| Package | Bundle (gzip) |
| --- | --- |
| `zod@3` | `12.47kb` |
| `zod@4` | `5.36kb` |

The core bundle is ~57% smaller in Zod 4 (2.3x). That's good! But we can do a lot better.

## [Introducing `@zod/mini`](https://v4.zod.dev/v4\#introducing-zodmini)

Zod's method-heavy API is fundamentally difficult to tree-shake. Even our simple `z.boolean()` script pulls in the implementations of a bunch of methods we didn't use, like `.optional()`, `.array()`, etc. Writing slimmer implementations can only get you so far. That's where `@zod/mini` comes in.

```
npm install @zod/mini@next
```

It's a sister library with a functional, tree-shakable API that corresponds one-to-one with `zod`. Where Zod uses methods, `@zod/mini` generally uses wrapper functions:

@zod/minizod

```
import * as z from "zod/v4-mini";

z.optional(z.string());

z.union([z.string(), z.number()]);

z.extend(z.object({ /* ... */ }), { age: z.number() });
```

Not all methods are gone! The parsing methods are identical in `zod` and `@zod/mini`.

```
import * as z from "zod/v4-mini";

z.string().parse("asdf");
z.string().safeParse("asdf");
await z.string().parseAsync("asdf");
await z.string().safeParseAsync("asdf");
```

There's also a general-purpose `.check()` method used to add refinements.

@zod/minizod

```
import * as z from "zod/v4-mini";

z.array(z.number()).check(
  z.minLength(5),
  z.maxLength(10),
  z.refine(arr => arr.includes(5))
);
```

The following top-level refinements are available in `@zod/mini`. It should be fairly self-explanatory which `zod` methods they correspond to.

```
import * as z from "zod/v4-mini";

// custom checks
z.refine();

// first-class checks
z.lt(value);
z.lte(value); // alias: z.maximum()
z.gt(value);
z.gte(value); // alias: z.minimum()
z.positive();
z.negative();
z.nonpositive();
z.nonnegative();
z.multipleOf(value);
z.maxSize(value);
z.minSize(value);
z.size(value);
z.maxLength(value);
z.minLength(value);
z.length(value);
z.regex(regex);
z.lowercase();
z.uppercase();
z.includes(value);
z.startsWith(value);
z.endsWith(value);
z.property(key, schema); // for object schemas; check `input[key]` against `schema`
z.mime(value); // for file schemas (see below)

// overwrites (these *do not* change the inferred type!)
z.overwrite(value => newValue);
z.normalize();
z.trim();
z.toLowerCase();
z.toUpperCase();
```

This more functional API makes it easier for bundlers to tree-shaking the APIs you don't use. While `zod` is still recommended for the majority of use cases, any projects with uncommonly strict bundle size constraints should consider `@zod/mini`.

### [6.6x reduction in core bundle size](https://v4.zod.dev/v4\#66x-reduction-in-core-bundle-size)

Here's the script from above, updated to use `"@zod/mini"` instead of `"zod"`.

```
import * as z from "zod/v4-mini";

const schema = z.boolean();
schema.parse(false);
```

When we build this with `rollup`, the gzipped bundle size is `1.88kb`. That's an 85% (6.6x) reduction in core bundle size compared to `zod@3`.

| Package | Bundle (gzip) |
| --- | --- |
| `zod@3` | `12.47kb` |
| `zod@4` | `5.36kb` |
| `@zod/mini` | `1.88kb` |

Learn more on the dedicated [`@zod/mini`](https://v4.zod.dev/packages/mini) docs page. Complete API details are mixed into existing documentation pages; code blocks contain separate tabs for `zod` and `@zod/mini` wherever their APIs diverge.

## [Metadata](https://v4.zod.dev/v4\#metadata)

Zod 4 introduces a new system for adding strongly-typed metadata to your schemas. Metadata isn't stored inside the schema itself; instead it's stored in a "schema registry" that associates a schema with some typed metadata. To create a registry with `z.registry()`:

```
import * as z from "zod/v4";

const myRegistry = z.registry<{ title: string; description: string }>();
```

To add schemas to your registry:

```
const emailSchema = z.string().email();

myRegistry.add(emailSchema, { title: "Email address", description: "..." });
myRegistry.get(emailSchema);
// => { title: "Email address", ... }
```

Alternatively, you can use the `.register()` method on a schema for convenience:

```
emailSchema.register(myRegistry, { title: "Email address", description: "..." })
// => returns emailSchema
```

### [The global registry](https://v4.zod.dev/v4\#the-global-registry)

Zod also exports a global registry `z.globalRegistry` that accepts some common JSON Schema-compatible metadata:

```
z.globalRegistry.add(z.string(), {
  id: "email_address",
  title: "Email address",
  description: "Provide your email",
  examples: ["naomie@example.com"],
  extraKey: "Additional properties are also allowed"
});
```

### [`.meta()`](https://v4.zod.dev/v4\#meta)

To conveniently add a schema to `z.globalRegistry`, use the `.meta()` method.

```
z.string().meta({
  id: "email_address",
  title: "Email address",
  description: "Provide your email",
  examples: ["naomie@example.com"],
  // ...
});
```

For compatibility with Zod 3, `.describe()` is still available, but `.meta()` is preferred.

```
z.string().describe("An email address");

// equivalent to
z.string().meta({ description: "An email address" });
```

## [JSON Schema conversion](https://v4.zod.dev/v4\#json-schema-conversion)

Zod 4 introduces first-party JSON Schema conversion via `z.toJSONSchema()`.

```
import * as z from "zod/v4";

const mySchema = z.object({name: z.string(), points: z.number()});

z.toJSONSchema(mySchema);
// => {
//   type: "object",
//   properties: {
//     name: {type: "string"},
//     points: {type: "number"},
//   },
//   required: ["name", "points"],
// }
```

Any metadata in `z.globalRegistry` is automatically included in the JSON Schema output.

```
const mySchema = z.object({
  firstName: z.string().describe("Your first name"),
  lastName: z.string().meta({ title: "last_name" }),
  age: z.number().meta({ examples: [12, 99] }),
});

z.toJSONSchema(mySchema);
// => {
//   type: 'object',
//   properties: {
//     firstName: { type: 'string', description: 'Your first name' },
//     lastName: { type: 'string', title: 'last_name' },
//     age: { type: 'number', examples: [ 12, 99 ] }
//   },
//   required: [ 'firstName', 'lastName', 'age' ]
// }
```

Refer to the [JSON Schema docs](https://v4.zod.dev/json-schema) for information on customizing the generated JSON Schema.

## [File schemas](https://v4.zod.dev/v4\#file-schemas)

To validate `File` instances:

```
const fileSchema = z.file();

fileSchema.min(10_000); // minimum .size (bytes)
fileSchema.max(1_000_000); // maximum .size (bytes)
fileSchema.type("image/png"); // MIME type
```

## [Internationalization](https://v4.zod.dev/v4\#internationalization)

Zod 4 introduces a new `locales` API for globally translating error messages into different languages.

```
import * as z from "zod/v4";

// configure English locale (default)
z.config(z.locales.en());
```

At the time of this writing only the English locale is available; There will be a call for pull request from the community shortly; this section will be updated with a list of supported languages as they become available.

## [Error pretty-printing](https://v4.zod.dev/v4\#error-pretty-printing)

The success of the [`zod-validation-error`](https://www.npmjs.com/package/zod-validation-error) package demonstrates that there's significant demand for an official API for pretty-printing errors. If you are using that package currently, by all means continue using it.

Zod now implements a top-level `z.prettifyError` function for converting a `ZodError` to a user-friendly formatted string.

```
const myError = new z.ZodError([\
  {\
    code: 'unrecognized_keys',\
    keys: [ 'extraField' ],\
    path: [],\
    message: 'Unrecognized key: "extraField"'\
  },\
  {\
    expected: 'string',\
    code: 'invalid_type',\
    path: [ 'username' ],\
    message: 'Invalid input: expected string, received number'\
  },\
  {\
    origin: 'number',\
    code: 'too_small',\
    minimum: 0,\
    inclusive: true,\
    path: [ 'favoriteNumbers', 1 ],\
    message: 'Too small: expected number to be >=0'\
  }\
]);

z.prettifyError(myError);
```

This returns the following pretty-printable multi-line string:

```
✖ Unrecognized key: "extraField"
✖ Invalid input: expected string, received number
  → at username
✖ Invalid input: expected number, received string
  → at favoriteNumbers[1]
```

Currently the formatting isn't configurable; this may change in the future.

## [Top-level string formats](https://v4.zod.dev/v4\#top-level-string-formats)

All "string formats" (email, etc.) have been promoted to top-level functions on the `z` module. This is both more concise and more tree-shakable. The method equivalents ( `z.string().email()`, etc.) are still available but have been deprecated. They'll be removed in the next major version.

```
z.email();
z.uuidv4();
z.uuidv7();
z.uuidv8();
z.ipv4();
z.ipv6();
z.cidrv4();
z.cidrv6();
z.url();
z.e164();
z.base64();
z.base64url();
z.jwt();
z.ascii();
z.utf8();
z.lowercase();
z.iso.date();
z.iso.datetime();
z.iso.duration();
z.iso.time();
```

### [Custom email regex](https://v4.zod.dev/v4\#custom-email-regex)

The `z.email()` API now supports a custom regular expression. There is no one canonical email regex; different applications may choose to be more or less strict. For convenience Zod exports some common ones.

```
// Zod's default email regex (Gmail rules)
// see colinhacks.com/essays/reasonable-email-regex
z.email(); // z.regexes.email

// the regex used by browsers to validate input[type=email] fields
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
z.email({ pattern: z.regexes.html5Email });

// the classic emailregex.com regex (RFC 5322)
z.email({ pattern: z.regexes.rfc5322Email });

// a loose regex that allows Unicode (good for intl emails)
z.email({ pattern: z.regexes.unicodeEmail });
```

## [Template literal types](https://v4.zod.dev/v4\#template-literal-types)

Zod 4 implements `z.templateLiteral()`. Template literal types are perhaps the biggest feature of TypeScript's type system that wasn't previously representable.

```
const hello = z.templateLiteral(["hello, ", z.string()]);
// `hello, ${string}`

const cssUnits = z.enum(["px", "em", "rem", "%"]);
const css = z.templateLiteral([z.number(), cssUnits]);
// `${number}px` | `${number}em` | `${number}rem` | `${number}%`

const email = z.templateLiteral([\
  z.string().min(1),\
  "@",\
  z.string().max(64),\
]);
// `${string}@${string}` (the min/max refinements are enforced!)
```

Every Zod schema type that can be stringified stores an internal regex: strings, string formats like `z.email()`, numbers, boolean, bigint, enums, literals, undefined/optional, null/nullable, and other template literals. The `z.templateLiteral` constructor concatenates these into a super-regex, so things like string formats ( `z.email()`) are properly enforced (but custom refinements are not!).

Read the [template literal docs](https://v4.zod.dev/api#template-literals) for more info.

## [Number formats](https://v4.zod.dev/v4\#number-formats)

New numeric "formats" have been added for representing fixed-width integer and float types. These return a `ZodNumber` instance with proper minimum/maximum constraints already added.

```
z.int();      // [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
z.float32();  // [-3.4028234663852886e38, 3.4028234663852886e38]
z.float64();  // [-1.7976931348623157e308, 1.7976931348623157e308]
z.int32();    // [-2147483648, 2147483647]
z.uint32();   // [0, 4294967295]
```

Similarly the following `bigint` numeric formats have also been added. These integer types exceed what can be safely represented by a `number` in JavaScript, so these return a `ZodBigInt` instance with the proper minimum/maximum constraints already added.

```
z.int64();    // [-9223372036854775808n, 9223372036854775807n]
z.uint64();   // [0n, 18446744073709551615n]
```

## [Stringbool](https://v4.zod.dev/v4\#stringbool)

The existing `z.coerce.boolean()` API is very simple: falsy values ( `false`, `undefined`, `null`, `0`, `""`, `NaN` etc) become `false`, truthy values become `true`.

This is still a good API, and its behavior aligns with the other `z.coerce` APIs. But some users requested a more sophisticated "env-style" boolean coercion. To support this, Zod 4 introduces `z.stringbool()`:

```
const strbool = z.stringbool();

strbool.parse("true")         // => true
strbool.parse("1")            // => true
strbool.parse("yes")          // => true
strbool.parse("on")           // => true
strbool.parse("y")            // => true
strbool.parse("enable")       // => true

strbool.parse("false");       // => false
strbool.parse("0");           // => false
strbool.parse("no");          // => false
strbool.parse("off");         // => false
strbool.parse("n");           // => false
strbool.parse("disabled");    // => false

strbool.parse(/* anything else */); // ZodError<[{ code: "invalid_value" }]>
```

To customize the truthy and falsy values:

```
z.stringbool({
  truthy: ["yes", "true"],
  falsy: ["no", "false"]
})
```

Refer to the [`z.stringbool()` docs](https://v4.zod.dev/api#stringbools) for more information.

## [Simplified error customization](https://v4.zod.dev/v4\#simplified-error-customization)

The majority of breaking changes in Zod 4 involve the _error customization_ APIs. They were a bit of a mess in Zod 3; Zod 4 makes things significantly more elegant, to the point where I think it's worth highlighting here.

Long story short, there is now a single, unified `error` parameter for customizing errors, replacing the following APIs:

Replace `message` with `error`. (The `message` parameter is still supported but deprecated.)

```
- z.string().min(5, { message: "Too short." });
+ z.string().min(5, { error: "Too short." });
```

Replace `invalid_type_error` and `required_error` with `error` (function syntax):

```
// Zod 3
- z.string({
-   required_error: "This field is required"
-   invalid_type_error: "Not a string",
- });

// Zod 4
+ z.string({ error: (issue) => issue.input === undefined ?
+  "This field is required" :
+  "Not a string"
+ });
```

Replace `errorMap` with `error` (function syntax):

```
// Zod 3
- z.string({
-   errorMap: (issue, ctx) => {
-     if (issue.code === "too_small") {
-       return { message: `Value must be >${issue.minimum}` };
-     }
-     return { message: ctx.defaultError };
-   },
- });

// Zod 4
+ z.string({
+   error: (issue) => {
+     if (issue.code === "too_small") {
+       return `Value must be >${issue.minimum}`
+     }
+   },
+ });
```

## [Upgraded `z.discriminatedUnion()`](https://v4.zod.dev/v4\#upgraded-zdiscriminatedunion)

Discriminated union support has improved in a couple ways. First, you no longer need to specify the discriminator key. Zod now has a robust way to identify the discriminator key automatically. If no shared discriminator key is found, Zod will throw an error at schema initialization time.

```
// in Zod 4:
const myUnion = z.discriminatedUnion([\
  z.object({ type: z.literal("a"), a: z.string() }),\
  z.object({ type: z.literal("b"), b: z.number() }),\
]);

// in Zod 3:
const myUnion = z.discriminatedUnion("type", [\
  z.object({ type: z.literal("a"), a: z.string() }),\
  z.object({ type: z.literal("b"), b: z.number() }),\
]);
```

Discriminated unions schema now finally _compose_—you can use one discriminated union as a member of another. Zod determines the optimal discrimination strategy.

```
const BaseError = z.object({ status: z.literal("failed"), message: z.string() });
const MyErrors = z.discriminatedUnion([\
  BaseError.extend({ code: z.literal(400) }),\
  BaseError.extend({ code: z.literal(401) }),\
  BaseError.extend({ code: z.literal(500) })\
]);

const MyResult = z.discriminatedUnion([\
  z.object({ status: z.literal("success"), data: z.string() }),\
  MyErrors\
]);
```

## [Multiple values in `z.literal()`](https://v4.zod.dev/v4\#multiple-values-in-zliteral)

The `z.literal()` API now optionally supports multiple values.

```
const httpCodes = z.literal([ 200, 201, 202, 204, 206, 207, 208, 226 ]);

// previously in Zod 3:
const httpCodes = z.union([\
  z.literal(200),\
  z.literal(201),\
  z.literal(202),\
  z.literal(204),\
  z.literal(206),\
  z.literal(207),\
  z.literal(208),\
  z.literal(226)\
]);
```

## [Refinements now live inside schemas](https://v4.zod.dev/v4\#refinements-now-live-inside-schemas)

In Zod 3, they were stored in a `ZodEffects` class that wrapped the original schema. This was inconvenient, as it meant you couldn't interleave `.refine()` with other schema methods like `.min()`.

```
z.string()
  .refine(val => val.includes("@"))
  .min(5);
// ^ ❌ Property 'min' does not exist on type ZodEffects<ZodString, string, string>
```

In Zod 4, refinements are stored inside the schemas themselves, so the code above works as expected.

```
z.string()
  .refine(val => val.includes("@"))
  .min(5); // ✅
```

### [`.overwrite()`](https://v4.zod.dev/v4\#overwrite)

The `.transform()` method is extremely useful, but it has one major downside: the output type is no longer _introspectable_ at runtime. The transform function is a black box that can return anything. This means (among other things) there's no sound way to convert the schema to JSON Schema.

```
const Squared = z.number().transform(val => val ** 2);
// => ZodPipe<ZodNumber, ZodTransform>
```

Zod 4 introduces a new `.overwrite()` method for representing transforms that _don't change the inferred type_. Unlike `.transform()`, this method returns an instance of the original class. The overwrite function is stored as a refinement, so it doesn't (and can't) modify the inferred type.

```
z.number().overwrite(val => val ** 2).max(100);
// => ZodNumber
```

The existing `.trim()`, `.toLowerCase()` and `.toUpperCase()` methods have been reimplemented using `.overwrite()`.

## [An extensible foundation: `@zod/core`](https://v4.zod.dev/v4\#an-extensible-foundation-zodcore)

While this will not be relevant to the majority of Zod users, it's worth highlighting. The addition of `@zod/mini` necessitated the creation of a third package `@zod/core` that contains the core functionality shared between `zod` and `@zod/mini`.

I was resistant to this at first, but now I see it as one of Zod 4's most important features. It lets Zod level up from a simple library to a fast validation "substrate" that can be sprinkled into other libraries.

If you're building a schema library, refer to the implementations of `zod` and `@zod/mini` to see how to build on top of the foundation `@zod/core` provides. Don't hesitate to get in touch in GitHub discussions or via [X](https://x.com/colinhacks)/ [Bluesky](https://bsky.app/profile/colinhacks.com) for help or feedback.

## [Wrapping up](https://v4.zod.dev/v4\#wrapping-up)

I'm planning to write up a series of additional posts explaining the design process and rationale behind some major features like `@zod/mini`. I'll update this section as those get posted.

Zod 4 will remain in beta for roughly 6 weeks as I work with library authors and major adopters to ensure a smooth day-one transition from Zod 3 to Zod 4. I encourage all users of Zod to upgrade their installation and provide feedback during the beta window.

```
pnpm upgrade zod@next
```

Happy parsing!

— Colin McDonnell [@colinhacks](https://x.com/colinhacks)

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/v4/index.mdx)

[Next\\
\\
Migration guide](https://v4.zod.dev/v4/changelog)

# Migration guide

To learn more about the performance enhancements and new features of Zod 4, read the [introductory post](https://v4.zod.dev/v4).

This migration guide aims to list the breaking changes in Zod 4 in order of highest to lowest impact. Every effort was made to prevent breaking changes, but some are unavoidable.

**Note** — Zod 3 exported a large number of undocumented, internal utility types and functions that are not considered part of the public API. Changes to those are not documented here.

To install the beta:

```
npm upgrade zod@next
```

## [Error customization](https://v4.zod.dev/v4/changelog\#error-customization)

This is perhaps the most visible of the removed APIs. Zod 4 standardizes the APIs for error customization under a single, unified `error` param.

### [deprecates `message`](https://v4.zod.dev/v4/changelog\#deprecates-message)

Replace `message` with `error`. The `message` parameter is still supported but deprecated.

Zod 4Zod 3

```
z.string().min(5, { error: "Too short." });
```

### [drops `invalid_type_error` and `required_error`](https://v4.zod.dev/v4/changelog\#drops-invalid_type_error-and-required_error)

The `invalid_type_error` / `required_error` params have been dropped. These were hastily added years ago as a way to customize errors that was less verbose than `errorMap`. They came with all sorts of footguns (they can't be used in conjunction with `errorMap`) and do not align with Zod's actual issue codes (there is no `required` issue code).

These can now be cleanly represented with the new `error` parameter.

Zod 4Zod 3

```
z.string({
  error: (issue) => issue.input === undefined
    ? "This field is required"
    : "Not a string"
});
```

### [drops `errorMap`](https://v4.zod.dev/v4/changelog\#drops-errormap)

This is renamed to `error`. Error maps can also now return a string or `undefined` (which yields control to the next error map in the chain).

Zod 4Zod 3

```
z.string({
  error: (issue) => {
    if (issue.code === "too_small") {
      return `Value must be >${issue.minimum}`
    }
  },
});
```

## [`ZodError`](https://v4.zod.dev/v4/changelog\#zoderror)

### [no longer extends `Error`](https://v4.zod.dev/v4/changelog\#no-longer-extends-error)

It is very slow to instantiate `Error` instances in JavaScript, as the initialization process snapshots the call stack. The magnitude of this performance hit is too much to justify, and extending `Error` adds little value anyway. The `.stack` trace includes lots of Zod internals and can be confusing.

In Zod 4 the `ZodError` class no longer extends the plain JavaScript `Error` class. Instead, `ZodError` `implements` the `Error` interface. This means all error-handling code should still work with the exception of `instanceof Error` checks.

```
try {
  z.string().parse(data)
} catch(err) {
  if (err instanceof z.ZodError) {
    // handle ZodError
  }

  if (err instanceof Error) {
    // handle regular Error
  }
}
```

### [updates issue formats](https://v4.zod.dev/v4/changelog\#updates-issue-formats)

The issue formats have been dramatically streamlined.

```
import * as z from "zod/v4"; // v4

type IssueFormats =
  | z.core.$ZodIssueInvalidType
  | z.core.$ZodIssueTooBig
  | z.core.$ZodIssueTooSmall
  | z.core.$ZodIssueInvalidStringFormat
  | z.core.$ZodIssueNotMultipleOf
  | z.core.$ZodIssueUnrecognizedKeys
  | z.core.$ZodIssueInvalidValue
  | z.core.$ZodIssueInvalidUnion
  | z.core.$ZodIssueInvalidKey // new: used for z.record/z.map
  | z.core.$ZodIssueInvalidElement // new: used for z.map/z.set
  | z.core.$ZodIssueCustom;
```

Below is the list of Zod 3 issues types and their Zod 4 equivalent:

```
import * as z from "zod/v4"; // v3

export type IssueFormats =
  | z.ZodInvalidTypeIssue // ♻️ renamed to z.core.$ZodIssueInvalidType
  | z.ZodTooBigIssue  // ♻️ renamed to z.core.$ZodIssueTooBig
  | z.ZodTooSmallIssue // ♻️ renamed to z.core.$ZodIssueTooSmall
  | z.ZodInvalidStringIssue // ♻️ z.core.$ZodIssueInvalidStringFormat
  | z.ZodNotMultipleOfIssue // ♻️ renamed to z.core.$ZodIssueNotMultipleOf
  | z.ZodUnrecognizedKeysIssue // ♻️ renamed to z.core.$ZodIssueUnrecognizedKeys
  | z.ZodInvalidUnionIssue // ♻️ renamed to z.core.$ZodIssueInvalidUnion
  | z.ZodCustomIssue // ♻️ renamed to z.core.$ZodIssueCustom
  | z.ZodInvalidEnumValueIssue // ❌ merged in z.core.$ZodIssueInvalidValue
  | z.ZodInvalidLiteralIssue // ❌ merged into z.core.$ZodIssueInvalidValue
  | z.ZodInvalidUnionDiscriminatorIssue // ❌ throws an Error at schema creation time
  | z.ZodInvalidArgumentsIssue // ❌ z.function throws ZodError directly
  | z.ZodInvalidReturnTypeIssue // ❌ z.function throws ZodError directly
  | z.ZodInvalidDateIssue // ❌ merged into invalid_type
  | z.ZodInvalidIntersectionTypesIssue // ❌ removed (throws regular Error)
  | z.ZodNotFiniteIssue // ❌ infinite values no longer accepted (invalid_type)
```

While certain Zod 4 issue types have been merged, dropped, and modified, each issue remains structurally similar to Zod 3 counterpart (identical, in most cases). All issues still conform to the same base interface as Zod 3, so most common error handling logic will work without modification.

```
export interface $ZodIssueBase {
  readonly code?: string;
  readonly input?: unknown;
  readonly path: PropertyKey[];
  readonly message: string;
}
```

### [changes error map precedence](https://v4.zod.dev/v4/changelog\#changes-error-map-precedence)

The error map precedence has been changed to be more consistent. Specifically, an error map passed into `.parse()` _no longer_ takes precedence over a schema-level error map.

```
const mySchema = z.string({ error: () => "Schema-level error" });

// in Zod 3
mySchema.parse(12, { error: () => "Contextual error" }); // => "Contextual error"

// in Zod 4
mySchema.parse(12, { error: () => "Contextual error" }); // => "Schema-level error"
```

### [deprecates `.format()`](https://v4.zod.dev/v4/changelog\#deprecates-format)

The `.format()` method on `ZodError` has been deprecated. Instead use the top-level `z.treeifyError()` function. Read the [Formatting errors docs](https://v4.zod.dev/error-formatting) for more information.

### [deprecates `.flatten()`](https://v4.zod.dev/v4/changelog\#deprecates-flatten)

The `.flatten()` method on `ZodError` has also been deprecated. Instead use the top-level `z.treeifyError()` function. Read the [Formatting errors docs](https://v4.zod.dev/error-formatting) for more information.

### [drops `.formErrors`](https://v4.zod.dev/v4/changelog\#drops-formerrors)

This API was identical to `.flatten()`. It exists for historical reasons and isn't documented.

### [deprecates `.addIssue()` and `.addIssues()`](https://v4.zod.dev/v4/changelog\#deprecates-addissue-and-addissues)

Directly push to `err.issues` array instead, if necessary.

```
myError.issues.push({
  // new issue
});
```

## [`z.number()`](https://v4.zod.dev/v4/changelog\#znumber)

### [no infinite values](https://v4.zod.dev/v4/changelog\#no-infinite-values)

`POSITIVE_INFINITY` and `NEGATIVE_INFINITY` are no longer considered valid values for `z.number()`.

### [`.int()` accepts safe integers only](https://v4.zod.dev/v4/changelog\#int-accepts-safe-integers-only)

The `z.number().int()` API no longer accepts unsafe integers (outside the range of `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`). Using integers out of this range causes spontaneous rounding errors.

## [`z.string()` updates](https://v4.zod.dev/v4/changelog\#zstring-updates)

### [deprecates `.email()` etc](https://v4.zod.dev/v4/changelog\#deprecates-email-etc)

String formats are now represented as _subclasses_ of `ZodString`, instead of simple internal refinements. As such, these APIs have been moved to the top-level `z` namespace. Top-level APIs are also less verbose and more tree-shakable.

```
z.email();
z.uuid();
z.url();
z.emoji();         // validates a single emoji character
z.base64();
z.base64url();
z.nanoid();
z.cuid();
z.cuid2();
z.ulid();
z.ipv4();
z.ipv6();
z.cidrv4();          // ip range
z.cidrv6();          // ip range
z.iso.date();
z.iso.time();
z.iso.datetime();
z.iso.duration();
```

The method forms ( `z.string().email()`) still exist and work as before, but are now deprecated.

```
z.string().email(); // ❌ deprecated
z.email(); // ✅
```

### [drops `z.string().ip()`](https://v4.zod.dev/v4/changelog\#drops-zstringip)

This has been replaced with separate `.ipv4()` and `.ipv6()` methods. Use `z.union()` to combine them if you need to accept both.

```
z.string().ip() // ❌
z.ipv4() // ✅
z.ipv6() // ✅
```

### [updates `z.string().ipv6()`](https://v4.zod.dev/v4/changelog\#updates-zstringipv6)

Validation now happens using the `new URL()` constructor, which is far more robust than the old regular expression approach. Some invalid values that passed validation previously may now fail.

### [drops `z.string().cidr()`](https://v4.zod.dev/v4/changelog\#drops-zstringcidr)

Similarly, this has been replaced with separate `.cidrv4()` and `.cidrv6()` methods. Use `z.union()` to combine them if you need to accept both.

```
z.string().cidr() // ❌
z.cidrv4() // ✅
z.cidrv6() // ✅
```

## [`z.coerce` updates](https://v4.zod.dev/v4/changelog\#zcoerce-updates)

The input type of all coerced booleans is now `unknown`.

```
const schema = z.coerce.string();
type schemaInput = z.input<typeof schema>;

// Zod 3: string;
// Zod 4: unknown;
```

## [`.default()` updates](https://v4.zod.dev/v4/changelog\#default-updates)

The application of `.default()` has changed in a subtle way.

```
T.default(default).parse(input); // where T is some schema
```

In Zod 3, this would be equivalent to:

```
// the default value would be parsed by the inner schema
T.parse(input ?? default);
```

in Zod 4, the default short-circuits the parsing process.

```
//
input === undefined ? default : T.parse(input);
```

To replicate the old behavior, you can use transform and pipe:

```
z.transform(val => val ?? default).pipe(T);
```

## [`z.object()`](https://v4.zod.dev/v4/changelog\#zobject)

These modifier methods on the `ZodObject` class determine how the schema handles unknown keys. In Zod 4, this functionality now exists in top-level functions. This aligns better with Zod's declarative-first philosophy, and puts all object variants on equal footing.

### [deprecates `.strict()` and `.passthrough()`](https://v4.zod.dev/v4/changelog\#deprecates-strict-and-passthrough)

These methods are generally no longer necessary. Instead use the top-level `z.strictObject()` and `z.looseObject()` functions.

```
// Zod 3
z.object({ name: z.string() }).strict();
z.object({ name: z.string() }).passthrough();

// Zod 4
z.strictObject({ name: z.string() });
z.looseObject({ name: z.string() });
```

These methods are still available for backwards compatibility, and they will not be removed. They are considered legacy.

### [deprecates `.strip()`](https://v4.zod.dev/v4/changelog\#deprecates-strip)

This was never particularly useful, as it was the default behavior of `z.object()`. To convert a strict object to a "regular" one, use `z.object(A.shape)`.

### [drops `.nonstrict()`](https://v4.zod.dev/v4/changelog\#drops-nonstrict)

This long-deprecated alias for `.strip()` has been removed.

### [drops `.deepPartial()`](https://v4.zod.dev/v4/changelog\#drops-deeppartial)

This has been long deprecated in Zod 3 and it now removed in Zod 4. There is no direct alternative to this API. There were lots of footguns in its implementation, and its use is generally an anti-pattern.

### [changes `z.unknown()` optionality](https://v4.zod.dev/v4/changelog\#changes-zunknown-optionality)

The `z.unknown()` and `z.any()` types are no longer marked as "key optional" in the inferred types.

```
const mySchema = z.object({
  a: z.any(),
  b: z.unknown()
});
// Zod 3: { a?: any; b?: unknown };
// Zod 4: { a: any; b: unknown };
```

## [`z.nativeEnum()` deprecated](https://v4.zod.dev/v4/changelog\#znativeenum-deprecated)

The `z.nativeEnum()` function is now deprecated in favor of just `z.enum()`. The `z.enum()` API has been overloaded to support an enum-like input.

```
enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue",
}

const ColorSchema = z.enum(Color); // ✅
```

As part of this refactor of `ZodEnum`, a number of long-deprecated and redundant features have been removed. These were all identical and only existed for historical reasons.

```
ColorSchema.enum.Red; // ✅ => "Red" (canonical API)
ColorSchema.Enum.Red; // ❌ removed
ColorSchema.Values.Red; // ❌ removed
```

## [`z.array()`](https://v4.zod.dev/v4/changelog\#zarray)

### [changes `.nonempty()` type](https://v4.zod.dev/v4/changelog\#changes-nonempty-type)

This now behaves identically to `z.array().min(1)`. The inferred type does not change.

```
const NonEmpty = z.array(z.string()).nonempty();

type NonEmpty = z.infer<typeof NonEmpty>;
// Zod 3: [string, ...string[]]
// Zod 4: string[]
```

The old behavior is now better represented with `z.tuple()` and a "rest" argument. This aligns more closely to TypeScript's type system.

```
z.tuple([z.string()], z.string());
// => [string, ...string[]]
```

## [`z.promise()` deprecated](https://v4.zod.dev/v4/changelog\#zpromise-deprecated)

There's rarely a reason to use `z.promise()`. If you have an input that may be a `Promise`, just `await` it before parsing it with Zod.

If you are using `z.promise` to define an async function with `z.function()`, that's no longer necessary either; see the [`ZodFunction`](https://v4.zod.dev/v4/changelog#function) section below.

## [`z.function()`](https://v4.zod.dev/v4/changelog\#zfunction)

The result of `z.function()` is no longer a Zod schema. Instead, it acts as a standalone "function factory" for defining Zod-validated functions. The API has also changed; you define an `input` and `output` schema upfront, instead of using `args()` and `.returns()` methods.

Zod 4Zod 3

```
const myFunction = z.function({
  input: [z.object({\
    name: z.string(),\
    age: z.number().int(),\
  })],
  output: z.string(),
});

myFunction.implement((input) => {
  return `Hello ${input.name}, you are ${input.age} years old.`;
});
```

### [adds `.implementAsync()`](https://v4.zod.dev/v4/changelog\#adds-implementasync)

To define an async function, use `implementAsync()` instead of `implement()`.

```
myFunction.implementAsync(async (input) => {
  return `Hello ${input.name}, you are ${input.age} years old.`;
});
```

## [`.refine()`](https://v4.zod.dev/v4/changelog\#refine)

### [ignores type predicates](https://v4.zod.dev/v4/changelog\#ignores-type-predicates)

In Zod 3, passing a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) as a refinement functions could still narrow the type of a schema. This wasn't documented but was discussed in some issues. This is no longer the case.

```
const mySchema = z.unknown().refine((val): val is string => {
  return typeof val === "string"
});

type MySchema = z.infer<typeof mySchema>;
// Zod 3: `string`
// Zod 4: still `unknown`
```

## [`z.ostring()`, etc dropped](https://v4.zod.dev/v4/changelog\#zostring-etc-dropped)

The undocumented convenience methods `z.ostring()`, `z.onumber()`, etc. have been removed. These were shorthand methods for defining optional string schemas.

## [`z.literal()` drops `symbol` support](https://v4.zod.dev/v4/changelog\#zliteral-drops-symbol-support)

Symbols aren't considered literal values, nor can they be simply compared with `===`. This was an oversight in Zod 3.

## [`.create()` factories dropped](https://v4.zod.dev/v4/changelog\#create-factories-dropped)

Previously all Zod classes defined a static `.create()` method. These are now implemented as standalone factory functions.

```
z.ZodString.create(); // ❌
```

## [`z.discriminatedUnion()`](https://v4.zod.dev/v4/changelog\#zdiscriminatedunion)

You no longer need to specify a discriminator key (though you still can if you wish; it is ignored).

```
// in Zod 4:
const myUnion = z.discriminatedUnion([\
  z.object({ type: z.literal("a"), a: z.string() }),\
  z.object({ type: z.literal("b"), b: z.number() }),\
]);

// in Zod 3:
const myUnion = z.discriminatedUnion("type", [\
  z.object({ type: z.literal("a"), a: z.string() }),\
  z.object({ type: z.literal("b"), b: z.number() }),\
]);
```

## [`z.record()`](https://v4.zod.dev/v4/changelog\#zrecord)

### [drops single argument usage](https://v4.zod.dev/v4/changelog\#drops-single-argument-usage)

Before, `z.record()` could be used with a single argument. This is no longer supported.

```
// Zod 3
z.record(z.string()); // ✅

// Zod 4
z.record(z.string()); // ❌
z.record(z.string(), z.string()); // ✅
```

### [improves enum support](https://v4.zod.dev/v4/changelog\#improves-enum-support)

Records have gotten a lot smarter. In Zod 3, passing an enum into `z.record()` as a key schema would result in a partial type

```
const myRecord = z.record(z.enum(["a", "b", "c"]), z.number());
// { a?: number; b?: number; c?: number; }
```

In Zod 4, this is no longer the case. The inferred type is what you'd expect, and Zod ensures exhaustiveness; that is, it makes sure all enum keys exist in the input during parsing.

```
const myRecord = z.record(z.enum(["a", "b", "c"]), z.number());
// { a: number; b: number; c: number; }
```

## [`z.intersection()`](https://v4.zod.dev/v4/changelog\#zintersection)

### [throws `Error` on merge conflict](https://v4.zod.dev/v4/changelog\#throws-error-on-merge-conflict)

Zod intersection parses the input against two schemas, then attempts to merge the results. In Zod 3, when the results were unmergable, Zod threw a `ZodError` with a special `"invalid_intersection_types"` issue.

In Zod 4, this will throw a regular `Error` instead. The existence of unmergable results indicates a structural problem with the schema: an intersection of two incompatible types. Thus, a regular error is more appropriate than a validation error.

## [Internal changes](https://v4.zod.dev/v4/changelog\#internal-changes)

The typical user of Zod can likely ignore everything below this line. These changes do not impact the user-facing `z` APIs.

There are too many internal changes to list here, but some may be relevant to regular users who are (intentionally or not) relying on certain implementation details. These changes will be of particular interest to library authors building tools on top of Zod.

### [updates generics](https://v4.zod.dev/v4/changelog\#updates-generics)

The generic structure of several classes has changed. Perhaps most significant is the change to the `ZodType` base class:

```
// Zod 3
class ZodType<Output, Def extends z.ZodTypeDef, Input = Output> {
  // ...
}

// Zod 4
class ZodType<Output = unknown, Input = unknown> {
  // ...
}
```

The second generic `Def` has been entirely removed. Instead the base class now only tracks `Output` and `Input`. While previously the `Input` value defaulted to `Output`, it now defaults to `unknown`. This allows generic functions involving `z.ZodType` to behave more intuitively in many cases.

```
function inferSchema<T extends z.ZodType>(schema: T): T {
  return schema;
};

inferSchema(z.string()); // z.ZodString
```

The need for `z.ZodTypeAny` has been eliminated; just use `z.ZodType` instead.

### [adds `z.core`](https://v4.zod.dev/v4/changelog\#adds-zcore)

Many utility functions and types have been moved to the new `@zod/core` package, to facilitate code sharing between `zod` and `@zod/mini`. The contents of `@zod/core` from `zod`/ `@zod/mini` using the `z.core` namespace. Check `z.core` if any internal APIs you rely on are missing; they've likely been moved there.

```
import * as z from "zod/v4";

function handleError(iss: z.core.utils.$ZodError) {
  // do stuff
}
```

### [moves `._def`](https://v4.zod.dev/v4/changelog\#moves-_def)

The `._def` property is now moved to `._zod.def`. The structure of all internal defs is subject to change; this is relevant to library authors but won't be comprehensively documented here.

### [drops `ZodEffects`](https://v4.zod.dev/v4/changelog\#drops-zodeffects)

This doesn't affect the user-facing APIs, but it's an internal change worth highlighting. It's part of a larger restructure of how Zod handles _refinements_.

Previously both refinements and transformations lived inside a wrapper class called `ZodEffects`. That means adding either one to a schema would wrap the original schema in a `ZodEffects` instance. In Zod 4, refinements now live inside the schemas themselves. More accurately, each schema contains an array of "checks"; the concept of a "check" is new in Zod 4 and generalizes the concept of a refinement to include potentially side-effectful transforms like `z.toLowerCase()`.

This is particularly apparent in the `@zod/mini` API, which heavily relies on the `.check()` method to compose various validations together.

```
import * as z from "zod/v4-mini";

z.string().check(
  z.minLength(10),
  z.maxLength(100),
  z.toLowerCase(),
  z.trim(),
);
```

### [adds `ZodTransform`](https://v4.zod.dev/v4/changelog\#adds-zodtransform)

Meanwhile, transforms have been moved into a dedicated `ZodTransform` class. This schema class represents an input transform; in fact, you can actually define standalone transformations now:

```
import * as z from "zod/v4";

const schema = z.transform(input => String(input));

schema.parse(12); // => "12"
```

This is primarily used in conjunction with `ZodPipe`. The `.transform()` method now returns an instance of `ZodPipe`.

```
z.string().transform(val => val); // ZodPipe<ZodString, ZodTransform>
```

### [drops `ZodPreprocess`](https://v4.zod.dev/v4/changelog\#drops-zodpreprocess)

As with `.transform()`, the `z.preprocess()` function now returns a `ZodPipe` instance instead of a dedicated `ZodPreprocess` instance.

```
z.preprocess(val => val, z.string()); // ZodPipe<ZodTransform, ZodString>
```

### [drops `ZodBranded`](https://v4.zod.dev/v4/changelog\#drops-zodbranded)

Branding is now handled with a direct modification to the inferred type, instead of a dedicated `ZodBranded` class. The user-facing APIs remain the same.

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/v4/changelog.mdx)

[Next\\
\\
Introducing Zod 4 beta](https://v4.zod.dev/v4) [Next\\
\\
Intro](https://v4.zod.dev/)

# Basic usage

This page will walk you through the basics of creating schemas, parsing data, and using inferred types. For complete documentation on Zod's schema API, refer to [Defining schemas](https://v4.zod.dev/api).

## [Defining a schema](https://v4.zod.dev/basics\#defining-a-schema)

Before you can do anything else, you need to define a schema. For the purposes of this guide, we'll use a simple object schema.

zod@zod/mini

```
import * as z from "zod/v4";

const Player = z.object({
  username: z.string(),
  xp: z.number()
});
```

## [Parsing data](https://v4.zod.dev/basics\#parsing-data)

Now that we have a schema, we can parse some data with it.

### [`.parse()`](https://v4.zod.dev/basics\#parse)

`.parse(data: unknown): T`

Given any Zod schema, use `.parse` to validate an input. If it's valid, Zod returns a strongly-typed _deep clone_ of the input.

```
Player.parse({ username: "billie", xp: 100 });
// => returns { username: "billie", xp: 100 }
```

Otherwise, a `ZodError` instance is thrown with detailed information about the validation issues.

zod@zod/mini

```
try {
  Player.parse({ username: 42, xp: "100" });
} catch(err){
  if(error instanceof z.ZodError){
    err.issues;
    /* [\
      {\
        expected: 'string',\
        code: 'invalid_type',\
        path: [ 'username' ],\
        message: 'Invalid input: expected string'\
      },\
      {\
        expected: 'number',\
        code: 'invalid_type',\
        path: [ 'xp' ],\
        message: 'Invalid input: expected number'\
      }\
    ] */
  }
}
```

**Note** — If your schema uses certain asynchronous APIs like `async` [refinements](https://v4.zod.dev/basics#refine) or [transforms](https://v4.zod.dev/basics#transform), you'll need to use the `.parseAsync()` method instead.

```
const schema = z.string().refine(async (val) => val.length <= 8);

await schema.parseAsync("hello");
// => "hello"
```

### [`.safeParse()`](https://v4.zod.dev/basics\#safeparse)

`.safeParse(data:unknown): { success: true; data: T; } | { success: false; error: ZodError; }`

To avoid `try/catch` blocks, use `.safeParse()`. This method returns an object containing either the successfully parsed data or a `ZodError`.

```
Player.safeParse({ username: "billie", xp: 100 });
// => { success: true; data: { username: "billie", xp: 100 } }

Player.safeParse({ username: 42, xp: "100" });
// => { success: false; error: ZodError }
```

The result type is a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions), so you can handle both cases conveniently:

```
const result = stringSchema.safeParse("billie");
if (!result.success) {
  result.error;   // handle error
} else {
  result.data;    // do stuff
}
```

**Note** — If your schema uses certain asynchronous APIs like `async` [refinements](https://v4.zod.dev/basics#refine) or [transforms](https://v4.zod.dev/basics#transform), you'll need to use the `.safeParseAsync()` method instead.

```
const schema = z.string().refine(async (val) => val.length <= 8);

await schema.safeParseAsync("hello");
// => { success: true; data: "hello" }
```

## [Inferred types](https://v4.zod.dev/basics\#inferred-types)

Zod infers a static type from your schema definitions. You can extract this type with the `z.infer<>` utility and use it however you like.

```
const Player = z.object({
  username: z.string(),
  xp: z.number()
});

// extract the inferred type
type Player = z.infer<typeof Player>;

// use it in your code
const player: Player = { username: "billie", xp: 100 };
```

* * *

Now that we have the basics covered, let's jump into the Schema API.

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/basics.mdx)

[Next\\
\\
Intro](https://v4.zod.dev/) [Next\\
\\
Defining schemas](https://v4.zod.dev/api)

![zod logo](https://v4.zod.dev/logo/logo-glow.png)![zod logo](https://v4.zod.dev/logo/logo-glow.png)

# Zod

TypeScript-first schema validation with static type inference

[Website](https://zod.dev/)  •  [Discord](https://discord.gg/RcG33DQJdf)  •  [𝕏](https://twitter.com/colinhacks)  •  [Bluesky](https://bsky.app/profile/zod.dev)

Zod 4 is now in beta! [Click here](https://v4.zod.dev/v4) to read the release notes.

Featured sponsor: Jazz [![Jazz logo](https://i.imgur.com/w1GE8ao.png)](https://jazz.tools/?utm_source=zod)

Interested in featuring? [Get in touch.](mailto:sponsorship@colinhacks.com)

## [Introduction](https://v4.zod.dev/\#introduction)

Zod is a TypeScript-first validation library. Using Zod, you can define _schemas_ you can use to validate data, from a simple `string` to a complex nested object.

```
import * as z from "zod/v4";

const User = z.object({
  name: z.string(),
});

// some untrusted data...
const input = { /* stuff */ };

// the parsed result is validated and type safe!
const data = User.parse(input);

// so you can use it with confidence :)
console.log(data.name);
```

## [Features](https://v4.zod.dev/\#features)

- Zero external dependencies
- Works in Node.js and all modern browsers
- Tiny: 2kb core bundle (gzipped)
- Immutable API: methods return a new instance
- Concise interface
- Works with TypeScript and plain JS
- Built-in JSON Schema conversion
- Extensive ecosystem

## [Requirements](https://v4.zod.dev/\#requirements)

Zod is tested against _TypeScript v5.5_ and later. Older versions may work but are not officially supported.

You must enable `strict` mode in your `tsconfig.json`. This is a best practice for all TypeScript projects.

```
// tsconfig.json
{
  // ...
  "compilerOptions": {
    // ...
    "strict": true
  }
}
```

## [Installation](https://v4.zod.dev/\#installation)

```
npm install zod       # npm
deno add npm:zod      # deno
yarn add zod          # yarn
bun add zod           # bun
pnpm add zod          # pnpm
```

Zod also publishes a canary version on every commit. To install the canary:

```
npm install zod@canary       # npm
deno add npm:zod@canary      # deno
yarn add zod@canary          # yarn
bun add zod@canary           # bun
pnpm add zod@canary          # pnpm
```

[Next\\
\\
Migration guide](https://v4.zod.dev/v4/changelog) [Next\\
\\
Basic usage](https://v4.zod.dev/basics)


# Defining schemas

To validate data, you must first define a _schema_. Schemas represent _types_, from simple primitive values to complex nested objects and arrays.

## [Primitives](https://v4.zod.dev/api\#primitives)

```
import { z } from "zod/v4";

// primitive types
z.string();
z.number();
z.bigint();
z.boolean();
z.symbol();
z.undefined();
z.null();
```

To coerce input data to the appropriate type, use `z.coerce` instead:

```
z.coerce.string();    // String(input)
z.coerce.number();    // Number(input)
z.coerce.boolean();   // Boolean(input)
z.coerce.bigint();    // BigInt(input)
```

The coerced variant of these schemas attempts to convert the input value to the appropriate type.

```
const schema = z.coerce.string();

schema.parse("tuna");    // => "tuna"
schema.parse(42);        // => "42"
schema.parse(true);      // => "true"
schema.parse(null);      // => "null"
```

### How coercion works in Zod

## [Literals](https://v4.zod.dev/api\#literals)

Literal schemas represent a [literal type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types), like `"hello world"` or `5`.

```
const tuna = z.literal("tuna");
const twelve = z.literal(12);
const twobig = z.literal(2n);
const tru = z.literal(true);
const terrific = z.literal(Symbol("terrific"));
```

To represent the JavaScript literals `null` and `undefined`:

```
z.null();
z.undefined();
z.void(); // equivalent to z.undefined()
```

To allow multiple literal values:

```
const colors = z.literal(["red", "green", "blue"]);

colors.parse("green"); // ✅
colors.parse("yellow"); // ❌
```

To extract the set of allowed values from a literal schema:

zod@zod/mini

```
colors.values; // => Set<"red" | "green" | "blue">
```

## [Strings](https://v4.zod.dev/api\#strings)

Zod provides a handful of built-in string validation and transform APIs. To perform some common string validations:

zod@zod/mini

```
z.string().max(5);
z.string().min(5);
z.string().length(5);
z.string().regex(/^[a-z]+$/);
z.string().startsWith("aaa");
z.string().endsWith("zzz");
z.string().includes("---");
z.string().uppercase();
z.string().lowercase();
```

To perform some simple string transforms:

zod@zod/mini

```
z.string().trim(); // trim whitespace
z.string().toLowerCase(); // toLowerCase
z.string().toUpperCase(); // toUpperCase
```

## [String formats](https://v4.zod.dev/api\#string-formats)

To validate against some common string formats:

```
z.email();
z.uuid();
z.url();
z.emoji();         // validates a single emoji character
z.base64();
z.base64url();
z.nanoid();
z.cuid();
z.cuid2();
z.ulid();
z.ipv4();
z.ipv6();
z.cidrv4();        // ipv4 CIDR block
z.cidrv6();        // ipv6 CIDR block
z.iso.date();
z.iso.time();
z.iso.datetime();
z.iso.duration();
```

### [Emails](https://v4.zod.dev/api\#emails)

To validate email addresses:

```
z.email();
```

By default, Zod uses a comparatively strict email regex designed to validate normal email addresses containing common characters. It's roughly equivalent to the rules enforced by Gmail. To learn more about this regex, refer to [this post](https://colinhacks.com/essays/reasonable-email-regex).

```
/^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i
```

To customize the email validation behavior, you can pass a custom regular expression to the `pattern` param.

```
z.email({ pattern: /your regex here/ });
```

Zod exports several useful regexes you could use.

```
// Zod's default email regex
z.email();
z.email({ pattern: z.regexes.email }); // equivalent

// the regex used by browsers to validate input[type=email] fields
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
z.email({ pattern: z.regexes.html5Email });

// the classic emailregex.com regex (RFC 5322)
z.email({ pattern: z.regexes.rfc5322Email });

// a loose regex that allows Unicode (good for intl emails)
z.email({ pattern: z.regexes.unicodeEmail });
```

### [UUIDs](https://v4.zod.dev/api\#uuids)

To validate UUIDs:

```
z.uuid();
```

To specify a particular UUID version:

```
// supports "v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"
z.uuid({ version: "v4" });

// for convenience
z.uuidv4();
z.uuidv6();
z.uuidv7();
```

The RFC 4122 UUID spec requires the first two bits of byte 8 to be `10`. Other UUID-like identifiers do not enforce this constraint. To validate any UUID-like identifier:

```
z.guid();
```

### [ISO datetimes](https://v4.zod.dev/api\#iso-datetimes)

As you may have noticed, Zod string includes a few date/time related validations. These validations are regular expression based, so they are not as strict as a full date/time library. However, they are very convenient for validating user input.

The `z.iso.datetime()` method enforces ISO 8601; by default, no timezone offsets are allowed:

```
const datetime = z.iso.datetime();

datetime.parse("2020-01-01T00:00:00Z"); // ✅
datetime.parse("2020-01-01T00:00:00.123Z"); // ✅
datetime.parse("2020-01-01T00:00:00.123456Z"); // ✅ (arbitrary precision)
datetime.parse("2020-01-01T00:00:00+02:00"); // ❌ (no offsets allowed)
```

To allow timesone offsets:

```
const datetime = z.iso.datetime({ offset: true });

datetime.parse("2020-01-01T00:00:00+02:00"); // ✅
datetime.parse("2020-01-01T00:00:00.123+02:00"); // ✅ (millis optional)
datetime.parse("2020-01-01T00:00:00.123+0200"); // ✅ (millis optional)
datetime.parse("2020-01-01T00:00:00.123+02"); // ✅ (only offset hours)
datetime.parse("2020-01-01T00:00:00Z"); // ✅ (Z still supported)
```

To allow unqualified (timezone-less) datetimes:

```
const schema = z.iso.datetime({ local: true });
schema.parse("2020-01-01T00:00:00"); // ✅
```

To constrain the allowable `precision` (by default, arbitrary sub-second precision is supported).

```
const datetime = z.iso.datetime({ precision: 3 });

datetime.parse("2020-01-01T00:00:00.123Z"); // ✅
datetime.parse("2020-01-01T00:00:00Z"); // ❌
datetime.parse("2020-01-01T00:00:00.123456Z"); // ❌
```

### [ISO dates](https://v4.zod.dev/api\#iso-dates)

The `z.iso.date()` method validates strings in the format `YYYY-MM-DD`.

```
const date = z.iso.date();

date.parse("2020-01-01"); // ✅
date.parse("2020-1-1"); // ❌
date.parse("2020-01-32"); // ❌
```

### [ISO times](https://v4.zod.dev/api\#iso-times)

Added in Zod 3.23

The `z.iso.time()` method validates strings in the format `HH:MM:SS[.s+]`. The second can include arbitrary decimal precision. It does not allow timezone offsets of any kind.

```
const time = z.iso.time();

time.parse("00:00:00"); // ✅
time.parse("09:52:31"); // ✅
time.parse("23:59:59.9999999"); // ✅ (arbitrary precision)

time.parse("00:00:00.123Z"); // ❌ (no `Z` allowed)
time.parse("00:00:00.123+02:00"); // ❌ (no offsets allowed)
```

You can set the `precision` option to constrain the allowable decimal precision.

```
const time = z.iso.time({ precision: 3 });

time.parse("00:00:00.123"); // ✅
time.parse("00:00:00.123456"); // ❌
time.parse("00:00:00"); // ❌
```

### [IP addresses](https://v4.zod.dev/api\#ip-addresses)

```
const ipv4 = z.ipv4();
v4.parse("192.168.0.0"); // ✅

const ipv6 = z.ipv6();
v6.parse("2001:db8:85a3::8a2e:370:7334"); // ✅
```

### [IP blocks (CIDR)](https://v4.zod.dev/api\#ip-blocks-cidr)

Validate IP address ranges specified with [CIDR notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing).

```
const cidrv4 = z.string().cidrv4();
cidrv4.parse("192.168.0.0/24"); // ✅

const cidrv6 = z.string().cidrv6();
cidrv6.parse("2001:db8::/32"); // ✅
```

## [Numbers](https://v4.zod.dev/api\#numbers)

Use `z.number()` to validate numbers. It allows any finite number.

```
const schema = z.number();

schema.parse(3.14);      // ✅
schema.parse(NaN);       // ❌
schema.parse(Infinity);  // ❌
```

Zod implements a handful of number-specific validations:

zod@zod/mini

```
z.number().gt(5);
z.number().gte(5);                     // alias .min(5)
z.number().lt(5);
z.number().lte(5);                     // alias .max(5)
z.number().positive();
z.number().nonnegative();
z.number().negative();
z.number().nonpositive();
z.number().multipleOf(5);              // alias .step(5)
```

If (for some reason) you want to validate `NaN`, use `z.nan()`.

```
z.nan().parse(NaN);              // ✅
z.nan().parse("anything else");  // ❌
```

## [Integers](https://v4.zod.dev/api\#integers)

To validate integers:

```
z.int();     // restricts to safe integer range
z.int32();   // restrict to int32 range
```

## [BigInts](https://v4.zod.dev/api\#bigints)

To validate BigInts:

```
z.bigint();
```

Zod includes a handful of bigint-specific validations.

zod@zod/mini

```
z.bigint().gt(5n);
z.bigint().gte(5n);                    // alias `.min(5n)`
z.bigint().lt(5n);
z.bigint().lte(5n);                    // alias `.max(5n)`
z.bigint().positive();
z.bigint().nonnegative();
z.bigint().negative();
z.bigint().nonpositive();
z.bigint().multipleOf(5n);             // alias `.step(5n)`
```

## [Booleans](https://v4.zod.dev/api\#booleans)

To validate boolean values:

```
z.boolean().parse(true); // => true
z.boolean().parse(false); // => false
```

## [Dates](https://v4.zod.dev/api\#dates)

Use `z.date()` to validate `Date` instances.

```
z.date().safeParse(new Date()); // success: true
z.date().safeParse("2022-01-12T00:00:00.000Z"); // success: false
```

To customize the error message:

```
z.date({
  error: issue => issue.input === undefined ? "Required" : "Invalid date"
});
```

Zod provides a handful of date-specific validations.

zod@zod/mini

```
z.date().min(new Date("1900-01-01"), { error: "Too old!" });
z.date().max(new Date(), { error: "Too young!" });
```

## [Enums](https://v4.zod.dev/api\#enums)

Use `z.enum` to validate inputs against a fixed set of allowable _string_ values.

```
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);

FishEnum.parse("Salmon"); // => "Salmon"
FishEnum.parse("Swordfish"); // => ❌
```

Careful — If you declare your string array as a variable, Zod won't be able to properly infer the exact values of each element.

```
const fish = ["Salmon", "Tuna", "Trout"];

const FishEnum = z.enum(fish);
type FishEnum = z.infer<typeof FishEnum>; // string
```

To fix this, always pass the array directly into the `z.enum()` function, or use [`as const`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions).

```
const fish = ["Salmon", "Tuna", "Trout"] as const;

const FishEnum = z.enum(fish);
type FishEnum = z.infer<typeof FishEnum>; // "Salmon" | "Tuna" | "Trout"
```

You can also pass in an externally-declared TypeScript enum.

**Zod 4** — This replaces the `z.nativeEnum()` API in Zod 3.

Note that using TypeScript's `enum` keyword is [not recommended](https://www.totaltypescript.com/why-i-dont-like-typescript-enums).

```
enum Fish {
  Salmon = "Salmon",
  Tuna = "Tuna",
  Trout = "Trout",
}

const FishEnum = z.enum(Fish);
```

### [`.enum`](https://v4.zod.dev/api\#enum)

To extract the schema's values as an enum-like object:

zod@zod/mini

```
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);

FishEnum.enum;
// => { Salmon: "Salmon", Tuna: "Tuna", Trout: "Trout" }
```

### [`.exclude()`](https://v4.zod.dev/api\#exclude)

To create a new enum schema, excluding certain values:

zod@zod/mini

```
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
const TunaOnly = FishEnum.exclude(["Salmon", "Trout"]);
```

### [`.extract()`](https://v4.zod.dev/api\#extract)

To create a new enum schema, extracting certain values:

zod@zod/mini

```
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
const SalmonAndTroutOnly = FishEnum.extract(["Salmon", "Trout"]);
```

## [Stringbool](https://v4.zod.dev/api\#stringbool)

**💎 New in Zod 4**

In some cases (e.g. parsing environment variables) it's valuable to parse certain string "boolish" values to a plain `boolean` value. To support this, Zod 4 introduces `z.stringbool()`:

```
const strbool = z.stringbool();

strbool.parse("true")         // => true
strbool.parse("1")            // => true
strbool.parse("yes")          // => true
strbool.parse("on")           // => true
strbool.parse("y")            // => true
strbool.parse("enable")       // => true

strbool.parse("false");       // => false
strbool.parse("0");           // => false
strbool.parse("no");          // => false
strbool.parse("off");         // => false
strbool.parse("n");           // => false
strbool.parse("disabled");    // => false

strbool.parse(/* anything else */); // ZodError<[{ code: "invalid_value" }]>
```

To customize the truthy and falsy values:

```
z.stringbool({
  truthy: ["yes", "true"],
  falsy: ["no", "false"]
})
```

Be default the schema is _case-insensitive_; all inputs are converted to lowercase before comparison to the `truthy`/ `falsy` values. To make it case-sensitive:

```
z.stringbool({
  case: "sensitive"
});
```

## [Optionals](https://v4.zod.dev/api\#optionals)

To make a schema _optional_ (that is, to allow `undefined` inputs).

zod@zod/mini

```
z.optional(z.literal("yoda")); // or z.literal("yoda").optional()
```

This returns a `ZodOptional` instance that wraps the original schema. To extract the inner schema:

zod@zod/mini

```
optionalYoda.unwrap(); // ZodLiteral<"yoda">
```

## [Nullables](https://v4.zod.dev/api\#nullables)

To make a schema _nullable_ (that is, to allow `null` inputs).

zod@zod/mini

```
z.nullable(z.literal("yoda")); // or z.literal("yoda").nullable()
```

This returns a `ZodNullable` instance that wraps the original schema. To extract the inner schema:

zod@zod/mini

```
nullableYoda.unwrap(); // ZodLiteral<"yoda">
```

## [Nullish](https://v4.zod.dev/api\#nullish)

To make a schema _nullish_ (both optional and nullable):

zod@zod/mini

```
const nullishYoda = z.nullish(z.literal("yoda"));
```

Refer to the TypeScript manual for more about the concept of [nullish](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing).

## [Unknown](https://v4.zod.dev/api\#unknown)

Zod aims to mirror TypeScript's type system one-to-one. As such, Zod provides APIs to represent the following special types:

```
// allows any values
z.any(); // inferred type: `any`
z.unknown(); // inferred type: `unknown`
```

## [Never](https://v4.zod.dev/api\#never)

No value will pass validation.

```
z.never(); // inferred type: `never`
```

## [Template literals](https://v4.zod.dev/api\#template-literals)

**💎 New in Zod 4**

Zod 4 finally implements one of the last remaining unrepresented features of TypeScript's type system: template literals. Virtually all primitive schemas can be used in `z.templateLiteral`: strings, string formats like `z.email()`, numbers, booleans, enums, literals (of the non-template variety), optional/nullable, and other template literals.

```
const hello = z.templateLiteral(["hello, ", z.string()]);
// `hello, ${string}`

const cssUnits = z.enum(["px", "em", "rem", "%"]);
const css = z.templateLiteral([z.number(), cssUnits ]);
// `${number}px` | `${number}em` | `${number}rem` | `${number}%`

const email = z.templateLiteral([\
  z.string().min(1),\
  "@",\
  z.string().max(64),\
]);
// `${string}@${string}` (the min/max refinements are enforced!)
```

## [Objects](https://v4.zod.dev/api\#objects)

To define an object type:

```
  // all properties are required by default
  const Person = z.object({
    name: z.string(),
    age: z.number(),
  });

  type Person = z.infer<typeof Person>;
  // => { name: string; age: number; }
```

By default, all properties are required. To make certain properties optional:

```
const Dog = z.object({
  name: z.string(),
  age: z.number().optional(),
});

Dog.parse({ name: "Yeller" }); // ✅
```

By default, unrecognized keys are _stripped_ from the parsed result:

```
Dog.parse({ name: "Yeller", extraKey: true });
// => { name: "Yeller" }
```

To define a _strict_ schema that throws an error when unknown keys are found:

```
const StrictDog = z.strictObject({
  name: z.string(),
});

StrictDog.parse({ name: "Yeller", extraKey: true });
// ❌ throws
```

To define a _loose_ schema that allows unknown keys to pass through:

```
const LooseDog = z.looseObject({
  name: z.string(),
});

Dog.parse({ name: "Yeller", extraKey: true });
// => { name: "Yeller", extraKey: true }
```

### [`.shape`](https://v4.zod.dev/api\#shape)

To access the internal schemas:

zod@zod/mini

```
Dog.shape.name; // => string schema
Dog.shape.age; // => number schema
```

### [`.keyof()`](https://v4.zod.dev/api\#keyof)

To create a `ZodEnum` schema from the keys of an object schema:

zod@zod/mini

```
const keySchema = Dog.keyof();
// => ZodEnum<["name", "age"]>
```

### [`.extend()`](https://v4.zod.dev/api\#extend)

To add additional fields to an object schema:

zod@zod/mini

```
const DogWithBreed = Dog.extend({
  breed: z.string(),
});
```

This API can be used to overwrite existing fields! Be careful with this power!

If the two schemas share keys, B will override A.

### [`.pick`](https://v4.zod.dev/api\#pick)

Inspired by TypeScript's built-in `Pick` and `Omit` utility types, Zod provides dedicated APIs for picking and omitting certain keys from an object schema.

Starting from this initial schema:

```
const Recipe = z.object({
  name: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.string()),
});
// { id: string; name: string; ingredients: string[] }
```

To pick certain keys:

zod@zod/mini

```
const JustTheTitle = Recipe.pick({ title: true });
```

### [`.omit`](https://v4.zod.dev/api\#omit)

To omit certain keys:

zod@zod/mini

```
const RecipeNoId = Recipe.omit({ id: true });
```

### [`.partial()`](https://v4.zod.dev/api\#partial)

For convenience, Zod provides a dedicated API for making some or all properties optional, inspired by the built-in TypeScript utility type [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype).

To make all fields optional:

zod@zod/mini

```
const PartialRecipe = Recipe.partial();
// { title?: string | undefined; description?: string | undefined; ingredients?: string[] | undefined }
```

To make certain properties optional:

zod@zod/mini

```
const RecipeOptionalIngredients = Recipe.partial({
  ingredients: true,
});
// { title: string; description?: string | undefined; ingredients?: string[] | undefined }
```

### [`.required()`](https://v4.zod.dev/api\#required)

Zod provides an API for making some or all properties _required_, inspired by TypeScript's [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype) utility type.

To make all properties required:

zod@zod/mini

```
const RequiredRecipe = Recipe.required();
// { title: string; description: string; ingredients: string[] }
```

To make certain properties required:

zod@zod/mini

```
const RecipeRequiredDescription = Recipe.required({description: true});
// { title: string; description: string; ingredients: string[] }
```

## [Recursive objects](https://v4.zod.dev/api\#recursive-objects)

To define a self-referential type, use a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) on the key. This lets JavaScript resolve the cyclical schema at runtime.

```
const Category = z.object({
  name: z.string(),
  get subcategories(){
    return z.array(Category)
  }
});

type Category = z.infer<typeof Category>;
// { name: string; subcategories: Category[] }
```

You can also represent _mutually recursive types_:

```
const User = z.object({
  email: z.email(),
  get posts(){
    return z.array(Post)
  }
});

const Post = z.object({
  title: z.string(),
  get author(){
    return User
  }
});
```

All object APIs (pick, omit, required, partial, etc) work as you'd expect.

Though recursive schemas are supported, passing cyclical data into Zod will cause an infinite loop.

## [Arrays](https://v4.zod.dev/api\#arrays)

To define an array schema:

zod@zod/mini

```
const stringArray = z.array(z.string()); // or z.string().array()
```

To access the inner schema for an element of the array.

zod@zod/mini

```
stringArray.unwrap(); // => string schema
```

### [`.min/.max/.length`](https://v4.zod.dev/api\#minmaxlength)

zod@zod/mini

```
z.array(z.string()).min(5); // must contain 5 or more items
z.array(z.string()).max(5); // must contain 5 or fewer items
z.array(z.string()).length(5); // must contain 5 items exactly
```

## [Tuples](https://v4.zod.dev/api\#tuples)

Unlike arrays, tuples are typically fixed-length arrays that specify different schemas for each index.

```
const MyTuple = z.tuple([\
  z.string(),\
  z.number(),\
  z.boolean()\
]);

type MyTuple = z.infer<typeof MyTuple>;
// [string, number, boolean]
```

To add a variadic ("rest") argument:

```
const variadicTuple = z.tuple([z.string()], z.number());
// => [string, ...number[]];
```

## [Unions](https://v4.zod.dev/api\#unions)

Union types ( `A | B`) represent a logical "OR". Zod union schemas will check the input against each option in order. The first value that validates successfully is returned.

```
const stringOrNumber = z.union([z.string(), z.number()]);
// string | number

stringOrNumber.parse("foo"); // passes
stringOrNumber.parse(14); // passes
```

To extract the internal option schemas:

zod@zod/mini

```
stringOrNumber.options; // [ZodString, ZodNumber]
```

## [Discriminated unions](https://v4.zod.dev/api\#discriminated-unions)

A [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) is a special kind of union in which a) all the options are object schemas that b) share a particular key (the "discriminator"). Based on the value of the discriminator key, TypeScript is able to "narrow" the type signature as you'd expect.

```
type MyResult =
  | { status: "success"; data: string }
  | { status: "failed"; error: string };

function handleResult(result: MyResult){
  if(result.status === "success"){
    result.data; // string
  } else {
    result.error; // string
  }
}
```

You could represent it with a regular `z.union()`. But regular unions are _naive_—they check the input against each option in order and return the first one that passes. This can be slow for large unions.

So Zod provides a `z.discriminatedUnion()` API that uses a _discriminator key_ to make parsing more efficient.

```
const MyResult = z.discriminatedUnion([\
  z.object({ status: z.literal("success"), data: z.string() }),\
  z.object({ status: z.literal("failed"), error: z.string() }),\
]);
```

In Zod 3, you were required to specify the discriminator key as the first argument. This is no longer necessary, as Zod can now automatically detect the discriminator key.

```
const MyResult = z.discriminatedUnion("status", [\
  z.object({ status: z.literal("success"), data: z.string() }),\
  z.object({ status: z.literal("failed"), error: z.string() }),\
]);
```

If Zod can't find a discriminator key, it will throw an error at schema creation time.

### Nesting discriminated unions

## [Intersections](https://v4.zod.dev/api\#intersections)

Intersection types ( `A & B`) represent a logical "AND".

```
const a = z.union([z.number(), z.string()]);
const b = z.union([z.number(), z.boolean()]);
const c = z.intersection(a, b);

type c = z.infer<typeof c>; // => number
```

This can be useful for intersecting two object types.

```
const Person = z.intersection({ name: z.string() });
type Person = z.infer<typeof Person>;

const Employee = z.intersection({ role: z.string() });
type Employee = z.infer<typeof Employee>;

const EmployedPerson = z.intersection(Person, Employee);
type EmployedPerson = z.infer<typeof EmployedPerson>;
// Person & Employee
```

In most cases, it is better to use [`A.extend(B)`](https://v4.zod.dev/api#extend) to merge two object schemas. This approach returns a new object schema, whereas `z.intersection(A, B)` returns a `ZodIntersection` instance which lacks common object methods like `pick` and `omit`.

## [Records](https://v4.zod.dev/api\#records)

Record schemas are used to validate types such as `Record<string, number>`.

### [`z.record()`](https://v4.zod.dev/api\#zrecord)

```
const IdCache = z.record(z.string(), z.string());
type IdCache = z.infer<typeof IdCache>; // Record<string, string>

IdCache.parse({
  carlotta: "77d2586b-9e8e-4ecf-8b21-ea7e0530eadd",
  jimmie: "77d2586b-9e8e-4ecf-8b21-ea7e0530eadd",
});
```

The key schema can be any Zod schema that is assignable to `string | number | symbol`.

```
const Keys = z.union([z.string(), z.number(), z.symbol()]);
const AnyObject = z.record(Keys, z.unknown());
// Record<string | number | symbol, unknown>
```

To create an object schemas containing keys defined by an enum:

```
const Keys = z.enum(["id", "name", "email"]);
const Person = z.record(Keys, z.string());
// { id: string; name: string; email: string }
```

**Zod 4** — In Zod 4, if you pass a `z.enum` as the first argument to `z.record()`, Zod will exhaustively check that all enum values exist in the input as keys. This behavior agrees with TypeScript:

```
type MyRecord = Record<"a" | "b", string>;
const myRecord: MyRecord = { a: "foo", b: "bar" }; // ✅
const myRecord: MyRecord = { a: "foo" }; // ❌ missing required key `b`
```

In Zod 3, exhaustiveness was not checked. To replicate the Zod 3 behavior, use `z.partialRecord()`.

### [`z.partialRecord()`](https://v4.zod.dev/api\#zpartialrecord)

If you want a _partial_ record type, use `z.partialRecord()`. This skips the special exhaustiveness checks Zod normally runs with `z.enum()` and `z.literal()` key schemas.

```
const Keys = z.enum(["id", "name", "email"]).or(z.never());
const Person = z.partialRecord(Keys, z.string());
// { id?: string; name?: string; email?: string }
```

### Partial records

### A note on numeric keys

## [Maps](https://v4.zod.dev/api\#maps)

```
const StringNumberMap = z.map(z.string(), z.number());
type StringNumberMap = z.infer<typeof StringNumberMap>; // Map<string, number>

const myMap: StringNumberMap = new Map();
myMap.set("one", 1);
myMap.set("two", 2);

StringNumberMap.parse(myMap);
```

## [Sets](https://v4.zod.dev/api\#sets)

```
const NumberSet = z.set(z.number());
type NumberSet = z.infer<typeof NumberSet>; // Set<number>

const mySet: NumberSet = new Set();
mySet.add(1);
mySet.add(2);
NumberSet.parse(mySet);
```

Set schemas can be further constrained with the following utility methods.

zod@zod/mini

```
z.set(z.string()).min(5); // must contain 5 or more items
z.set(z.string()).max(5); // must contain 5 or fewer items
z.set(z.string()).size(5); // must contain 5 items exactly
```

## [Promises](https://v4.zod.dev/api\#promises)

**Deprecated** — `z.promise()` is deprecated in Zod 4. There are vanishingly few valid uses cases for a `Promise` schema. If you suspect a value might be a `Promise`, simply `await` it before parsing it with Zod.

### See z.promise() documentation

## [Instanceof](https://v4.zod.dev/api\#instanceof)

You can use `z.instanceof` to check that the input is an instance of a class. This is useful to validate inputs against classes that are exported from third-party libraries.

```
class Test {
  name: string;
}

const TestSchema = z.instanceof(Test);

TestSchema.parse(new Test()); // ✅
TestSchema.parse("whatever"); // ❌
```

## [Refinements](https://v4.zod.dev/api\#refinements)

Every Zod schema stores an array of _refinements_. Refinements are a way to perform custom validation that Zod doesn't provide a native API for.

### [`.refine()`](https://v4.zod.dev/api\#refine)

zod@zod/mini

```
const myString = z.string().refine((val) => val.length <= 255);
```

Refinement functions should never throw. Instead they should return a falsy value to signal failure. Thrown errors are not caught by Zod.

To customize the error message:

zod@zod/mini

```
const myString = z.string().refine((val) => val.length > 8, {
  error: "Too short!"
});
```

By default, validation issues from checks are considered _continuable_; that is, Zod will execute _all_ checks in sequence, even if one of them causes a validation error. This is usually desirable, as it means Zod can surface as many errors as possible in one go.

zod@zod/mini

```
const myString = z.string()
  .refine((val) => val.length > 8)
  .refine((val) => val === val.toLowerCase());


const result = myString.safeParse("OH NO");
result.error.issues;
/* [\
  { "code": "custom", "message": "Too short!" },\
  { "code": "custom", "message": "Must be lowercase" }\
] */
```

To mark a particular refinement as _non-continuable_, use the `abort` parameter. Validation will terminate if the check fails.

zod@zod/mini

```
const myString = z.string()
  .refine((val) => val.length > 8, { abort: true })
  .refine((val) => val === val.toLowerCase());


const result = myString.safeParse("OH NO");
result.error!.issues;
// => [{ "code": "custom", "message": "Too short!" }]
```

To customize the error path, use the `path` parameter. This is typically only useful in the context of object schemas.

zod@zod/mini

```
const passwordForm = z
  .object({
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"], // path of error
  });
```

This will set the `path` parameter in the associated issue:

zod@zod/mini

```
const result = passwordForm.safeParse({ password: "asdf", confirm: "qwer" });
result.error.issues;
/* [{\
  "code": "custom",\
  "path": [ "confirm" ],\
  "message": "Passwords don't match"\
}] */
```

Refinements can be `async`:

```
const userId = z.string().refine(async (id) => {
  // verify that ID exists in database
  return true;
});
```

If you use async refinements, you must use the `.parseAsync` method to parse data! Otherwise Zod will throw an error.

zod@zod/mini

```
const result = await userId.parseAsync("abc123");
```

### [`.superRefine()`](https://v4.zod.dev/api\#superrefine)

In Zod 4, `.superRefine()` has been deprecated in favor of `.check()`

### View .superRefine() example

### [`.check()`](https://v4.zod.dev/api\#check)

The `.refine()` API is syntactic sugar atop a more versatile (and verbose) API called `.check()`. You can use this API to create multiple issues in a single refinement or have full control of the generated issue objects.

zod@zod/mini

```
const UniqueStringArray = z.array(z.string()).check((ctx) => {
  if (ctx.value.length > 3) {
    ctx.issues.push({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items 😡",
      input: ctx.value
    });
  }

  if (ctx.value.length !== new Set(ctx.value).size) {
    ctx.issues.push({
      code: "custom",
      message: `No duplicates allowed.`,
      input: ctx.value,
      continue: true // make this issue continuable (default: false)
    });
  }
});
```

The regular `.refine` API only generates issues with a `"custom"` error code, but `.check()` makes it possible to throw other issue types. For more information on Zod's internal issue types, read the [Error customization](https://v4.zod.dev/error-customization) docs.

## [Pipes](https://v4.zod.dev/api\#pipes)

Schemas can be chained together into "pipes". Pipes are primarily useful when used in conjunction with [Transforms](https://v4.zod.dev/api#transforms).

zod@zod/mini

```
const stringToLength = z.string().pipe(z.transform(val => val.length));

stringToLength.parse("hello"); // => 5
```

## [Transforms](https://v4.zod.dev/api\#transforms)

Transforms are a special kind of schema. Instead of validating input, they accept anything and perform some transformation on the data. To define a transform:

zod@zod/mini

```
const castToString = z.transform((val) => String(val));

castToString.parse("asdf"); // => "asdf"
castToString.parse(123); // => "123"
castToString.parse(true); // => "true"
```

To perform validation logic inside a transform, use `ctx`. To report a validation issue, push a new issue onto `ctx.issues` (similar to the [`.check()`](https://v4.zod.dev/api#check) API).

```
const coercedInt = z.transform((val, ctx) => {
  try {
    const parsed = Number.parseInt(String(val));
    return parsed;
  } catch (e) {
    ctx.issues.push({
      code: "custom",
      message: "Not a number",
      input: val,
    });

    // this is a special constant with type `never`
    // returning it lets you exit the transform without impacting the inferred return type
    return z.NEVER;
  }
});
```

Most commonly, transforms are used in conjunction with [Pipes](https://v4.zod.dev/api#pipes). This combination is useful for performing some initial validation, then transforming the parsed data into another form.

zod@zod/mini

```
const stringToLength = z.string().pipe(z.transform(val => val.length));

stringToLength.parse("hello"); // => 5
```

### [`.transform()`](https://v4.zod.dev/api\#transform)

Piping some schema into a transform is a common pattern, so Zod provides a convenience `.transform()` method.

zod@zod/mini

```
const stringToLength = z.string().transform(val => val.length);
```

Transforms can also be async:

zod@zod/mini

```
const idToUser = z
  .string()
  .transform(async (id) => {
    // fetch user from database
    return db.getUserById(id);
  });

const user = await idToUser.parseAsync("abc123");
```

If you use async transforms, you must use a `.parseAsync` or `.safeParseAsync` when parsing data! Otherwise Zod will throw an error.

### [`.preprocess()`](https://v4.zod.dev/api\#preprocess)

Piping a transform into another schema is another common pattern, so Zod provides a convenience `z.preprocess()` function.

## [Defaults](https://v4.zod.dev/api\#defaults)

To set a default value for a schema:

zod@zod/mini

```
const defaultTuna = z.string().default("tuna");

defaultTuna.parse(undefined); // => "tuna"
```

Alternatively, you can pass a function which will be re-executed whenever a default value needs to be generated:

zod@zod/mini

```
const randomDefault = z.number().default(Math.random);

randomDefault.parse(undefined);    // => 0.4413456736055323
randomDefault.parse(undefined);    // => 0.1871840107401901
randomDefault.parse(undefined);    // => 0.7223408162401552
```

## [Catch](https://v4.zod.dev/api\#catch)

Use `.catch()` to define a fallback value to be returned in the event of a validation error:

zod@zod/mini

```
const numberWithCatch = z.number().catch(42);

numberWithCatch.parse(5); // => 5
numberWithCatch.parse("tuna"); // => 42
```

Alternatively, you can pass a function which will be re-executed whenever a catch value needs to be generated.

zod@zod/mini

```
const numberWithRandomCatch = z.number().catch((ctx) => {
  ctx.error; // the caught ZodError
  return Math.random();
});

numberWithRandomCatch.parse("sup"); // => 0.4413456736055323
numberWithRandomCatch.parse("sup"); // => 0.1871840107401901
numberWithRandomCatch.parse("sup"); // => 0.7223408162401552
```

## [Branded types](https://v4.zod.dev/api\#branded-types)

TypeScript's type system is [structural](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), meaning that two types that are structurally equivalent are considered the same.

```
type Cat = { name: string };
type Dog = { name: string };

const pluto: Dog = { name: "pluto" };
const simba: Cat = fido; // works fine
```

In some cases, it can be desirable to simulate [nominal typing](https://en.wikipedia.org/wiki/Nominal_type_system) inside TypeScript. This can be achieved with _branded types_ (also known as "opaque types").

```
const Cat = z.object({ name: z.string() }).brand<"Cat">();
const Dog = z.object({ name: z.string() }).brand<"Dog">();

type Cat = z.infer<typeof Cat>; // { name: string } & z.$brand<"Cat">
type Dog = z.infer<typeof Dog>; // { name: string } & z.$brand<"Dog">

const pluto = Dog.parse({ name: "pluto" });
const simba: Cat = pluto; // ❌ not allowed
```

Under the hood, this works by attaching a "brand" to the schema's inferred type.

```
const Cat = z.object({ name: z.string() }).brand<"Cat">();
type Cat = z.infer<typeof Cat>; // { name: string } & z.$brand<"Cat">
```

With this brand, any plain (unbranded) data structures are no longer assignable to the inferred type. You have to parse some data with the schema to get branded data.

Note that branded types do not affect the runtime result of `.parse`. It is a static-only construct.

## [Readonly](https://v4.zod.dev/api\#readonly)

To mark a schema as readonly:

zod@zod/mini

```
const ReadonlyUser = z.object({ name: z.string() }).readonly();
type ReadonlyUser = z.infer<typeof ReadonlyUser>;
// Readonly<{ name: string }>
```

This returns a new schema that wraps the original. The new schema's inferred type will be marked as `readonly`. Note that this only affects objects, arrays, tuples, `Set`, and `Map` in TypeScript:

zod@zod/mini

```
z.object({ name: z.string() }).readonly(); // { readonly name: string }
z.array(z.string()).readonly(); // readonly string[]
z.tuple([z.string(), z.number()]).readonly(); // readonly [string, number]
z.map(z.string(), z.date()).readonly(); // ReadonlyMap<string, Date>
z.set(z.string()).readonly(); // ReadonlySet<string>
```

Inputs will be parsed using the original schema, then the result will be frozen with [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to prevent modifications.

zod@zod/mini

```
const result = ReadonlyUser.parse({ name: "fido" });
result.name = "simba"; // throws TypeError
```

## [Template literals](https://v4.zod.dev/api\#template-literals-1)

**New in Zod 4**

To define a template literal schema:

```
const schema = z.templateLiteral("hello, ", z.string(), "!");
// `hello, ${string}!`
```

The `z.templateLiteral` API can handle any number of string literals (e.g. `"hello"`) and schemas. Any schema with an inferred type that's assignable to `string | number | bigint | boolean | null | undefined` can be passed.

```
z.templateLiteral([ "hi there" ]);
// `hi there`

z.templateLiteral([ "email: ", z.string()]);
// `email: ${string}`

z.templateLiteral([ "high", z.literal(5) ]);
// `high5`

z.templateLiteral([ z.nullable(z.literal("grassy")) ]);
// `grassy` | `null`

z.templateLiteral([ z.number(), z.enum(["px", "em", "rem"]) ]);
// `${number}px` | `${number}em` | `${number}rem`
```

## [JSON](https://v4.zod.dev/api\#json)

To validate any JSON-encodable value:

```
const jsonSchema = z.json();
```

This is a convenience API that returns the following union schema:

```
const jsonSchema = z.lazy(() => {
  return z.union([\
    z.string(params),\
    z.number(),\
    z.boolean(),\
    z.null(),\
    z.array(jsonSchema),\
    z.record(z.string(), jsonSchema)\
  ]);
});
```

## [Custom](https://v4.zod.dev/api\#custom)

You can create a Zod schema for any TypeScript type by using `z.custom()`. This is useful for creating schemas for types that are not supported by Zod out of the box, such as template string literals.

```
const px = z.custom<`${number}px`>((val) => {
  return typeof val === "string" ? /^\d+px$/.test(val) : false;
});

type px = z.infer<typeof px>; // `${number}px`

px.parse("42px"); // "42px"
px.parse("42vw"); // throws;
```

If you don't provide a validation function, Zod will allow any value. This can be dangerous!

```
z.custom<{ arg: string }>(); // performs no validation
```

You can customize the error message and other options by passing a second argument. This parameter works the same way as the params parameter of [`.refine`](https://v4.zod.dev/api#refine).

```
z.custom<...>((val) => ..., "custom error message");
```

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/api.mdx)

[Next\\
\\
Basic usage](https://v4.zod.dev/basics) [Next\\
\\
Customizing errors](https://v4.zod.dev/error-customization)

# Customizing errors

In Zod, validation errors are surfaced as instances of the `z.core.$ZodError` class.

The `zod` package uses a subclass of this called `ZodError` that implements some additional convenience methods.

Instances of `$ZodError` contain an `.issues` property containing a human-readable `message` and additional structured information about each encountered validation issue.

zod@zod/mini

```
import * as z from "zod/v4";

const result = z.string().safeParse(12); // { success: false, error: ZodError }
result.error.issues;
// [\
//   {\
//     expected: 'string',\
//     code: 'invalid_type',\
//     path: [],\
//     message: 'Invalid input: expected string, received number'\
//   }\
// ]
```

Every issue inside a `$ZodError` contains a `message` property with a human-readable error message. This message can be customized in a number of ways.

## [The `error` param](https://v4.zod.dev/error-customization\#the-error-param)

Virtually every Zod API accepts an optional error message parameter.

```
z.string("Not a string!");
```

This custom error will show up as the `message` property of any validation issues that originate from this schema.

```
z.string("Not a string!").parse(12);
// ❌ throws ZodError {
//   issues: [\
//     {\
//       expected: 'string',\
//       code: 'invalid_type',\
//       path: [],\
//       message: 'Not a string!'   <-- 👀 custom error message\
//     }\
//   ]
// }
```

All `z` functions and schema methods accept custom errors.

zod@zod/mini

```
z.string("Bad!");
z.string().min(5, "Too short!");
z.uuid("Bad UUID!");
z.iso.date("Bad date!");
z.array(z.string(), "Bad array!");
z.array(z.string()).min(5, "Too few items!");
z.set(z.string(), "Bad set!");
```

If you prefer, you can pass a params object with an `error` parameter instead.

zod@zod/mini

```
z.string({ error: "Bad!" });
z.string().min(5, { error: "Too short!" });
z.uuid({ error: "Bad UUID!" });
z.iso.date({ error: "Bad date!" });
z.array(z.string(), { error: "Bad array!" });
z.array(z.string()).min(5, { error: "Too few items!" });
z.set(z.string(), { error: "Bad set!" });
```

The `error` param optionally accepts a function. This function will be called at parse time if a valiation error occurs.

```
z.string({ error: ()=>`[${Date.now()}]: Validation failure.` });
```

**Note** — In Zod v3, there were separate params for `message` (a string) and `errorMap` (a function). These have been unified in Zod 4 as `error`.

The `error` function received a context object you can use to customize the error message based on the `input` or other validation information.

zod@zod/mini

```
z.string({
  error: (iss) => iss.input===undefined ? "Field is required." : "Invalid input."
});
```

For advanced cases, the `iss` object provides additional information you can use to customize the error.

zod@zod/mini

```
z.string({
  error: (iss) => {
    iss.code; // the issue code
    iss.input; // the input data
    iss.inst; // the schema/check that originated this issue
    iss.path; // the path of the error
  },
});
```

Depending on the API you are using, there may be additional properties available. Use TypeScript's autocomplete to explore the available properties.

```
z.string().min(5, {
  error: (iss) => {
    // ...the same as above
    iss.minimum; // the minimum value
    iss.inclusive; // whether the minimum is inclusive
    return `Password must have ${iss.minimum} characters or more`;
  },
});
```

## [Per-parse error customization](https://v4.zod.dev/error-customization\#per-parse-error-customization)

To customize errors on a _per-parse_ basis, pass an error map into the parse method:

```
const schema = z.string()

schema.parse(12, {
  error: iss => "per-parse custom error"
};
```

This has _lower precedence_ than any schema-level custom messages.

```
const schema = z.string({ error: "highest priority" });
const result = schema.safeParse(12, {
  error: (iss) => "lower priority",
})

result.error.issues;
// [{ message: "highest priority", ... }]
```

The `iss` object is a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) of all possible issue types. Use the `code` property to discriminate between them.

For a breakdown of all Zod issue codes, see the [`@zod/core`](https://v4.zod.dev/packages/core#issue-types) documentation.

```
const result = schema.safeParse(12, {
  error: (iss) => {
    if (iss.code === "invalid_type") {
      return `invalid type, expected ${iss.expected}`;
    }
    if (iss.code === "too_small") {
      return `minimum is ${iss.minimum}`;
    }
    // ...
  }
})
```

## [Global error customization](https://v4.zod.dev/error-customization\#global-error-customization)

To specify a global error map, use `z.config()` to set Zod's `customError` configuration setting:

```
z.config({
  customError: (iss) => {
    return "globally modified error";
  },
});
```

Global error messages have _lower precedence_ than schema-level or per-parse error messages.

The `iss` object is a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) of all possible issue types. Use the `code` property to discriminate between them.

For a breakdown of all Zod issue codes, see the [`@zod/core`](https://v4.zod.dev/packages/core#issue-types) documentation.

```
const result = schema.safeParse(12, {
  error: (iss) => {
    if (iss.code === "invalid_type") {
      return `invalid type, expected ${iss.expected}`;
    }
    if (iss.code === "too_small") {
      return `minimum is ${iss.minimum}`;
    }
    // ...
  }
})
```

## [Internationalization](https://v4.zod.dev/error-customization\#internationalization)

To support internationalization of error message, Zod provides several built-in **locales**. These are exported from the `@zod/core` package.

**Note** — The `zod` library automatically loads the `en` locale automatically. The `@zod/mini` package does not load any locale; instead all error messages default to `Invalid input`.

zod@zod/mini

```
import * as z from "zod/v4";
import en from "@zod/core/locales/en"

z.config(en());
```

To lazily load a locale, consider dynamic imports:

```
import * as z from "zod/v4";

async function loadLocale (locale: string) {
  const { default: locale } = await import(`@zod/core/locales/${locale}`);
  z.config(locale());
};

await loadLocale("fr");
```

For convenience, all locales are exported as `z.locales` feom `zod`/ `@zod/mini`.

zod@zod/mini

```
import * as z from "zod/v4";

z.config(z.locales.en());
```

### [Locales](https://v4.zod.dev/error-customization\#locales)

The following locales are available:

- `ar` — Arabic
- `az` — Azerbaijani
- `be` — Belarusian
- `ca` — Catalan
- `cs` — Czech
- `de` — German
- `en` — English
- `es` — Spanish
- `fa` — Farsi
- `fi` — Finnish
- `fr` — French
- `frCA` — Canadian French
- `he` — Hebrew
- `hu` — Hungarian
- `id` — Indonesian
- `it` — Italian
- `ja` — Japanese
- `ko` — Korean
- `mk` — Macedonian
- `ms` — Malay
- `no` — Norwegian
- `ota` — Türkî
- `pl` — Polish
- `pt` — Portuguese
- `ru` — Russian
- `sl` — Slovenian
- `ta` — Tamil
- `th` — Thai
- `tr` — Türkçe
- `ua` — Ukrainian
- `ur` — Urdu
- `vi` — Tiếng Việt
- `zhCN` — Simplified Chinese
- `zhTW` — Traditional Chinese

## [Error precedence](https://v4.zod.dev/error-customization\#error-precedence)

Below is a quick reference for determining error precedence: if multiple error customizations have been defined, which one takes priority? From _highest to lowest_ priority:

1. **Schema-level error** — Any error message "hard coded" into a schema definition.

```
z.string("Not a string!");
```

2. **Per-parse error** — A custom error map passed into the `.parse()` method.

```
z.string().parse(12, {
  error: (iss) => "My custom error"
});
```

3. **Global error map** — A custom error map passed into `z.config()`.

```
z.config({
  customError: (iss) => "My custom error"
});
```

4. **Locale error map** — A custom error map passed into `z.config()`.

```
z.config(z.locales.en());
```

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/error-customization.mdx)

[Next\\
\\
Defining schemas](https://v4.zod.dev/api) [Next\\
\\
Formatting errors](https://v4.zod.dev/error-formatting)

# Formatting errors

Zod emphasizes _completeness_ and _correctness_ in its error reporting. In many cases, it's helpful to convert the `$ZodError` to a more useful format. Zod provides some utilities for this.

Consider this simple object schema.

```
const schema = z.strictObject({
  username: z.string(),
  favoriteNumbers: z.array(z.number()),
});
```

Attempting to parse this invalid data results in an error containing two issues.

```
const result = schema.safeParse({
  username: 1234,
  favoriteNumbers: [1234, "4567"],
  extraKey: 1234,
});

result.error!.issues;
[\
  {\
    expected: 'string',\
    code: 'invalid_type',\
    path: [ 'username' ],\
    message: 'Invalid input: expected string, received number'\
  },\
  {\
    expected: 'number',\
    code: 'invalid_type',\
    path: [ 'favoriteNumbers', 1 ],\
    message: 'Invalid input: expected number, received string'\
  },\
  {\
    code: 'unrecognized_keys',\
    keys: [ 'extraKey' ],\
    path: [],\
    message: 'Unrecognized key: "extraKey"'\
  }\
];
```

## [`z.treeifyError()`](https://v4.zod.dev/error-formatting\#ztreeifyerror)

To convert ("treeify") this error into a nested object, use `z.treeifyError()`.

```
const tree = z.treeifyError(result.error);

// =>
{
  errors: [ 'Unrecognized key: "extraKey"' ],
  properties: {
    username: { errors: [ 'Invalid input: expected string, received number' ] },
    favoriteNumbers: {
      errors: [],
      items: [\
        undefined,\
        {\
          errors: [ 'Invalid input: expected number, received string' ]\
        }\
      ]
    }
  }
}
```

The result is a nested structure that mirrors the schema itself. You can easily access the errors that occured at a particular path. The `errors` field contains the error messages at a given path, and the special properties `properties` and `items` let you traverse deeper into the tree.

```
tree.properties?.username?.errors;
// => ["Invalid input: expected string, received number"]

tree.properties?.favoriteNumbers?.items?.[1]?.errors;
// => ["Invalid input: expected number, received string"];
```

Be sure to use optional chaining ( `?.`) to avoid errors when accessing nested properties.

## [`z.prettifyError()`](https://v4.zod.dev/error-formatting\#zprettifyerror)

The `z.prettifyError()` provides a human-readable string representation of the error.

```
const pretty = z.prettifyError(result.error);
```

This returns the following string:

```
✖ Unrecognized key: "extraKey"
✖ Invalid input: expected string, received number
  → at username
✖ Invalid input: expected number, received string
  → at favoriteNumbers[1]
```

## [`z.formatError()`](https://v4.zod.dev/error-formatting\#zformaterror)

This has been deprecated in favor of `z.treeifyError()`.

### Show docs

## [`z.flattenError()`](https://v4.zod.dev/error-formatting\#zflattenerror)

This has been deprecated in favor of `z.treeifyError()`.

### Show docs

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/error-formatting.mdx)

[Next\\
\\
Customizing errors](https://v4.zod.dev/error-customization) [Next\\
\\
Metadata and registries](https://v4.zod.dev/metadata)

# Metadata and registries

It's often useful to associate a schema with some additional _metadata_ for documentation, code generation, AI structured outputs, form validation, and other purposes.

## [Registries](https://v4.zod.dev/metadata\#registries)

Metadata in Zod is handled via _registries_. Registries are collections of schemas, each associated with some _strongly-typed_ metadata. To create a simple registry:

```
import * as z from "zod/v4";

const myRegistry = z.registry<{ description: string }>();
```

To register, lookup, and remove schemas from this registry:

```
const mySchema = z.string();

myRegistry.add(mySchema, { description: "A cool schema!"});
myRegistry.has(mySchema); // => true
myRegistry.get(mySchema); // => { description: "A cool schema!" }
myRegistry.remove(mySchema);
```

TypeScript enforces that the metadata for each schema matches the registry's **metadata type**.

```
myRegistry.add(mySchema, { description: "A cool schema!" }); // ✅
myRegistry.add(mySchema, { description: 123 }); // ❌
```

### [`.register()`](https://v4.zod.dev/metadata\#register)

**Note** — This method is special in that it does not return a new schema; instead, it returns the original schema. No other Zod method does this! That includes `.meta()` and `.describe()` (documented below) which return a new instance.

Schemas provide a `.register()` method to more conveniently add it to a registry.

```
const mySchema = z.string();

mySchema.register(myRegistry, { description: "A cool schema!" });
// => mySchema
```

This lets you define metadata "inline" in your schemas.

```
const mySchema = z.object({
  name: z.string().register(myRegistry, { description: "The user's name" }),
  age: z.number().register(myRegistry, { description: "The user's age" }),
})
```

If a registry is defined without a metadata type, you can use it as a generic "collection", no metadata required.

```
const myRegistry = z.registry();

myRegistry.add(z.string());
myRegistry.add(z.number());
```

## [Metadata](https://v4.zod.dev/metadata\#metadata)

### [`z.globalRegistry`](https://v4.zod.dev/metadata\#zglobalregistry)

For convenience, Zod provides a global registry ( `z.globalRegistry`) that can be used to store metadata for JSON Schema generation or other purposes. It accepts the following metadata:

```
export interface GlobalMeta {
  id?: string;
  title?: string;
  description?: string;
  examples?: T[]; // T is the output type of the schema you are registering
  [k: string]: unknown; // accepts other properties too
}
```

To register some metadata in `z.globalRegistry` for a schema:

```
import * as z from "zod/v4";

const emailSchema = z.email().register(z.globalRegistry, {
  id: "email_address",
  title: "Email address",
  description: "Your email address",
  examples: ["first.last@example.com"]
});
```

### [`.meta()`](https://v4.zod.dev/metadata\#meta)

For a more convenient approach, use the `.meta()` method to register a schema in `z.globalRegistry`.

zod@zod/mini

```
const emailSchema = z.email().meta({
  id: "email_address",
  title: "Email address",
  description: "Please enter a valid email address",
});
```

Calling `.meta()` without an argument will _retrieve_ the metadata for a schema.

```
emailSchema.meta();
// => { id: "email_address", title: "Email address", ... }
```

### [`.describe()`](https://v4.zod.dev/metadata\#describe)

The `.describe()` method still exists for compatibility with Zod 3, but `.meta()` is now the recommended approach.

The `.describe()` method is a shorthand for registering a schema in `z.globalRegistry` with just a `description` field.

zod@zod/mini

```
const emailSchema = z.email();
emailSchema.describe("An email address");

// equivalent to
emailSchema.meta({ description: "An email address" });
```

## [Custom registries](https://v4.zod.dev/metadata\#custom-registries)

You've already seen a simple example of a custom registry:

```
import * as z from "zod/v4";

const myRegistry = z.registry<{ description: string };>();
```

Let's look at some more advanced patterns.

### [Referencing inferred types](https://v4.zod.dev/metadata\#referencing-inferred-types)

It's often valuable for the metadata type to reference the _inferred type_ of a schema. For instance, you may want an `examples` field to contain examples of the schema's output.

```
import * as z from "zod/v4";

type MyMeta = { examples: z.$output[] };
const myRegistry = z.registry<MyMeta>();

myRegistry.add(z.string(), { examples: ["hello", "world"] });
myRegistry.add(z.number(), { examples: [1, 2, 3] });
```

The special symbol `z.$output` is a reference to the schemas inferred output type ( `z.infer<typeof schema>`). Similarly you can use `z.$input` to reference the input type.

### [Constraining schema types](https://v4.zod.dev/metadata\#constraining-schema-types)

Pass a second generic to `z.registry()` to constrain the schema types that can be added to a registry. This registry only accepts string schemas.

```
import * as z from "zod/v4";

const myRegistry = z.registry<{ description: string }, z.ZodString>();

myRegistry.add(z.string(), { description: "A number" }); // ✅
myRegistry.add(z.number(), { description: "A number" }); // ❌
//             ^ 'ZodNumber' is not assignable to parameter of type 'ZodString'
```

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/metadata.mdx)

[Next\\
\\
Formatting errors](https://v4.zod.dev/error-formatting) [Next\\
\\
JSON Schema](https://v4.zod.dev/json-schema)

# JSON Schema

💎

**New** — Zod 4 introduces a new feature: native [JSON Schema](https://json-schema.org/) conversion. JSON Schema is a standard for describing the structure of JSON (with JSON). It's widely used in [OpenAPI](https://www.openapis.org/) definitions and defining [structured outputs](https://platform.openai.com/docs/guides/structured-outputs?api-mode=chat) for AI.

To convert a Zod schema to JSON Schema, use the `z.toJSONSchema()` function.

```
import * as z from "zod/v4";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

z.toJSONSchema(schema)
// => {
//   type: 'object',
//   properties: { name: { type: 'string' }, age: { type: 'number' } },
//   required: [ 'name', 'age' ]
// }
```

All schema & checks are converted to their closest JSON Schema equivalent. Some types have no analog and cannot be reasonably represented. See the [\`unrepresentable'](https://v4.zod.dev/json-schema#unrepresentable) section below for more information on handling these cases.

```
z.bigint(); // ❌
z.int64(); // ❌
z.symbol(); // ❌
z.void(); // ❌
z.date(); // ❌
z.map(); // ❌
z.set(); // ❌
z.file(); // ❌
z.transform(); // ❌
z.nan(); // ❌
z.custom(); // ❌
```

## [String formats](https://v4.zod.dev/json-schema\#string-formats)

Zod converts the following schema types to the equivalent JSON Schema `format`:

```
// Supported via `format`
z.email(); // => { type: "string", format: "email" }
z.iso.datetime(); // => { type: "string", format: "date-time" }
z.iso.date(); // => { type: "string", format: "date" }
z.iso.time(); // => { type: "string", format: "time" }
z.iso.duration(); // => { type: "string", format: "duration" }
z.ipv4(); // => { type: "string", format: "ipv4" }
z.ipv6(); // => { type: "string", format: "ipv6" }
z.uuid(); // => { type: "string", format: "uuid" }
z.guid(); // => { type: "string", format: "uuid" }
z.url(); // => { type: "string", format: "uri" }
```

These schemas are supported via `contentEncoding`:

```
z.base64(); // => { type: "string", contentEncoding: "base64" }
```

All other string formats are supported via `pattern`:

```
z.base64url();
z.cuid();
z.regex();
z.emoji();
z.nanoid();
z.cuid2();
z.ulid();
z.cidrv4();
z.cidrv6();
```

## [Numeric types](https://v4.zod.dev/json-schema\#numeric-types)

Zod converts the following numeric types to JSON Schema:

```
// number
z.number(); // => { type: "number" }
z.float32(); // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }
z.float64(); // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }

// integer
z.int(); // => { type: "integer" }
z.int32(); // => { type: "integer", exclusiveMinimum: ..., exclusiveMaximum: ... }
```

## [Nullability](https://v4.zod.dev/json-schema\#nullability)

Zod converts both `undefined`/ `null` to `{ type: "null" }` in JSON Schema.

```
z.null();
// => { type: "null" }

z.undefined();
// => { type: "null" }
```

Similarly, `optional` and `nullable` are made nullable via `oneOf`:

```
z.optional(z.string());
// => { oneOf: [{ type: "string" }, { type: "null" }] }

z.nullable(z.string());
// => { oneOf: [{ type: "string" }, { type: "null" }] }
```

## [Configuration](https://v4.zod.dev/json-schema\#configuration)

A second argument can be used to customize the conversion logic.

```
z.toJSONSchema(schema, {
  // ...params
})
```

Below is a quick reference for each supported parameter. Each one is explained in more detail below.

```
interface ToJSONSchemaParams {
  /** The JSON Schema version to target.
   * - `"draft-2020-12"` — Default. JSON Schema Draft 2020-12
   * - `"draft-7"` — Default. JSON Schema Draft 7 */
  target?: "draft-7" | "draft-2020-12";

  /** A registry used to look up metadata for each schema.
   * Any schema with an `id` property will be extracted as a $def. */
  metadata?: $ZodRegistry<Record<string, any>>;

  /** How to handle unrepresentable types.
   * - `"throw"` — Default. Unrepresentable types throw an error
   * - `"any"` — Unrepresentable types become `{}` */
  unrepresentable?: "throw" | "any";

  /** How to handle cycles.
   * - `"ref"` — Default. Cycles will be broken using $defs
   * - `"throw"` — Cycles will throw an error if encountered */
  cycles?: "ref" | "throw";

  /* How to handle reused schemas.
   * - `"inline"` — Default. Reused schemas will be inlined
   * - `"ref"` — Reused schemas will be extracted as $defs */
  reused?: "ref" | "inline";

  /** A function used to convert `id` values to URIs to be used in *external* $refs.
   *
   * Default is `(id) => id`.
   */
  uri?: (id: string) => string;
}
```

### [`target`](https://v4.zod.dev/json-schema\#target)

To set the target JSON Schema version, use the `target` parameter. By default, Zod will target Draft 2020-12.

```
z.toJSONSchema(schema, { target: "draft-7" });
z.toJSONSchema(schema, { target: "draft-2020-12" });
```

### [`metadata`](https://v4.zod.dev/json-schema\#metadata)

If you haven't already, read through the [Metadata and registries](https://v4.zod.dev/metadata) page for context on storing metadata in Zod.

In Zod, metadata is stored in registries. Zod exports a global registry `z.globalRegistry` that can be used to store common metadata fields like `id`, `title`, `description`, and `examples`.

zod@zod/mini

```
import * as z from "zod/v4";

// `.meta()` is a convenience method for registering a schema in `z.globalRegistry`
const emailSchema = z.string().meta({
  title: "Email address",
  description: "Your email address",
});

z.toJSONSchema(emailSchema);
// => { type: "string", title: "Email address", description: "Your email address", ... }
```

### [`unrepresentable`](https://v4.zod.dev/json-schema\#unrepresentable)

The following APIs are not representable in JSON Schema. By default, Zod will throw an error if they are encountered. It is unsound to attempt a conversion to JSON Schema; you should modify your schemas as they have no equivalent in JSON. An error will be thrown if any of these are encountered.

```
z.bigint(); // ❌
z.int64(); // ❌
z.symbol(); // ❌
z.void(); // ❌
z.date(); // ❌
z.map(); // ❌
z.set(); // ❌
z.file(); // ❌
z.transform(); // ❌
z.nan(); // ❌
z.custom(); // ❌
```

By default, Zod will throw an error if any of these are encountered.

```
z.toJSONSchema(z.bigint());
// => throws Error
```

You can change this behavior by setting the `unrepresentable` option to `"any"`. This will convert any unrepresentable types to `{}` (the equivalent of `unknown` in JSON Schema).

```
z.toJSONSchema(z.bigint(), { unrepresentable: "any" });
// => {}
```

### [`cycles`](https://v4.zod.dev/json-schema\#cycles)

How to handle cycles. If a cycle is encountered as `z.toJSONSchema()` traverses the schema, it will be represented using `$ref`.

```
const User = z.object({
  name: z.string(),
  get friend() {
    return User;
  },
});

toJSONSchema(User);
// => {
//   type: 'object',
//   properties: { name: { type: 'string' }, friend: { '$ref': '#' } },
//   required: [ 'name', 'friend' ]
// }
```

If instead you want to throw an error, set the `cycles` option to `"throw"`.

```
z.toJSONSchema(User, { cycles: "throw" });
// => throws Error
```

### [`reused`](https://v4.zod.dev/json-schema\#reused)

How to handle schemas that occur multiple times in the same schema. By default, Zod will inline these schemas.

```
const name = z.string();
const User = z.object({
  firstName: name,
  lastName: name,
});

z.toJSONSchema(User);
// => {
//   type: 'object',
//   properties: {
//     firstName: { type: 'string' },
//     lastName: { type: 'string' }
//   },
//   required: [ 'firstName', 'lastName' ]
// }
```

Instead you can set the `reused` option to `"ref"` to extract these schemas into `$defs`.

```
z.toJSONSchema(User, { reused: "ref" });
// => {
//   type: 'object',
//   properties: {
//     firstName: { '$ref': '#/$defs/__schema0' },
//     lastName: { '$ref': '#/$defs/__schema0' }
//   },
//   required: [ 'firstName', 'lastName' ],
//   '$defs': { __schema0: { type: 'string' } }
// }
```

### [`override`](https://v4.zod.dev/json-schema\#override)

To define some custom override logic, use `override`. The provided callback has access to the original Zod schema and the default JSON Schema. _This function should dircectly modify `ctx.jsonSchema`._

```
const mySchema = /* ... */
z.toJSONSchema(mySchema, {
  override: (ctx)=>{
    ctx.zodSchema; // the original Zod schema
    ctx.jsonSchema; // the default JSON Schema

    // directly modify
    ctx.jsonSchema.whatever = "sup";
  }
});
```

### [`io`](https://v4.zod.dev/json-schema\#io)

Some schema types have different input and output types, e.g. `ZodPipe`, `ZodDefault`, and coerced primitives. By default, the result of `z.toJSONSchema` represents the _output type_; use `"io": "input"` to extract the input type instead.

```
const mySchema = z.string().transform(val => val.length).pipe(z.number());
// ZodPipe

const jsonSchema = z.toJSONSchema(mySchema);
// => { type: "number" }

const jsonSchema = z.toJSONSchema(mySchema, { io: "input" });
// => { type: "string" }
```

## [Registries](https://v4.zod.dev/json-schema\#registries)

Passing a schema into `z.toJSONSchema()` will return a _self-contained_ JSON Schema.

In other cases, you may have a set of Zod schemas you'd like to represent using multiple interlinked JSON Schemas, perhaps to write to `.json` files and serve from a web server. To achieve this, you can pass a [registry](https://v4.zod.dev/metadata#registries) into `z.toJSONSchema()`.

```
import * as z from "zod/v4";

const User = z.object({
  name: z.string(),
  get posts(){
    return z.array(Post);
  }
});

const Post = z.object({
  title: z.string(),
  content: z.string(),
  get author(){
    return User;
  }
});

z.globalRegistry.add(User, {id: "User"});
z.globalRegistry.add(Post, {id: "Post"});
```

The schemas above both have an `id` property registered in `z.globalRegistry`. To convert these to JSON Schema, pass the entire registry into `z.toJSONSchema()`.

```
z.toJSONSchema(z.globalRegistry);
// => {
//   schemas: {
//     User: {
//       id: 'User',
//       type: 'object',
//       properties: {
//         name: { type: 'string' },
//         posts: { type: 'array', items: { '$ref': 'Post' } }
//       },
//       required: [ 'name', 'posts' ]
//     },
//     Post: {
//       id: 'Post',
//       type: 'object',
//       properties: {
//         title: { type: 'string' },
//         content: { type: 'string' },
//         author: { '$ref': 'User' }
//       },
//       required: [ 'title', 'content', 'author' ]
//     }
//   }
// }
```

Any schema with an `id` property in the registry will be extracted into `schemas`.

By default, the `$ref` URIs are relative paths like `"User"`. To make these absolute URIs, use the `uri` option. This expects a function that converts an `id` to a fully-qualified URI.

```
z.toJSONSchema(z.globalRegistry, {
  uri: (id) => `https://example.com/${id}.json`
});
// => {
//   schemas: {
//     User: {
//       id: 'User',
//       type: 'object',
//       properties: {
//         name: { type: 'string' },
//         posts: {
//           type: 'array',
//           items: { '$ref': 'https://example.com/Post.json' }
//         }
//       },
//       required: [ 'name', 'posts' ]
//     },
//     Post: {
//       id: 'Post',
//       type: 'object',
//       properties: {
//         title: { type: 'string' },
//         content: { type: 'string' },
//         author: { '$ref': 'https://example.com/User.json' }
//       },
//       required: [ 'title', 'content', 'author' ]
//     }
//   }
// }
```

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/json-schema.mdx)

[Next\\
\\
Metadata and registries](https://v4.zod.dev/metadata) [Next\\
\\
Ecosystem](https://v4.zod.dev/ecosystem)

# Ecosystem

**Note** — To avoid bloat and confusion, the Ecosystem section has been wiped clean with the release of Zod 4. If you've updated your library to work with Zod 4, please submit a PR to add it back in.

There are a growing number of tools that are built atop or support Zod natively! If you've built a tool or library on top of Zod, let me know [on Twitter](https://twitter.com/colinhacks) or [start a Discussion](https://github.com/colinhacks/zod/discussions). I'll add it below and tweet it out.

## [Resources](https://v4.zod.dev/ecosystem\#resources)

- [Total TypeScript Zod Tutorial](https://www.totaltypescript.com/tutorials/zod) by [@mattpocockuk](https://twitter.com/mattpocockuk)
- [Fixing TypeScript's Blindspot: Runtime Typechecking](https://www.youtube.com/watch?v=rY_XqfSHock) by [@jherr](https://twitter.com/jherr)

## [API Libraries](https://v4.zod.dev/ecosystem\#api-libraries)

| Name | Stars | Description |
| --- | --- | --- |
| [`tRPC`](https://github.com/trpc/trpc) | ⭐️ 37239 | Build end-to-end typesafe APIs without GraphQL. |
| [`GQLoom`](https://gqloom.dev/) | ⭐️ 47 | Weave GraphQL schema and resolvers using Zod. |

## [Form Integrations](https://v4.zod.dev/ecosystem\#form-integrations)

| Name | Stars | Description |
| --- | --- | --- |
| [`@regle/schemas`](https://github.com/victorgarciaesgi/regle/tree/main/packages/schemas) | ⭐️ 186 | Headless form validation library for Vue.js. |

## [Zod to X](https://v4.zod.dev/ecosystem\#zod-to-x)

| Name | Stars | Description |
| --- | --- | --- |

## [X to Zod](https://v4.zod.dev/ecosystem\#x-to-zod)

| Name | Stars | Description |
| --- | --- | --- |
| [`orval`](https://github.com/orval-labs/orval) | ⭐️ 3956 | Generate Zod schemas from OpenAPI schemas |
| [`kubb`](https://github.com/kubb-labs/kubb) | ⭐️ 1131 | The ultimate toolkit for working with APIs. |

## [Mocking Libraries](https://v4.zod.dev/ecosystem\#mocking-libraries)

| Name | Stars | Description |
| --- | --- | --- |
| [`zod-schema-faker`](https://github.com/soc221b/zod-schema-faker) | ⭐️ 53 | Generate mock data from zod schemas. Powered by @faker-js/faker and randexp.js. |

## [Powered by Zod](https://v4.zod.dev/ecosystem\#powered-by-zod)

| Name | Stars | Description |
| --- | --- | --- |
| [`Composable Functions`](https://github.com/seasonedcc/composable-functions) | ⭐️ 704 | Types and functions to make composition easy and safe. |
| [`zod-config`](https://github.com/alexmarqs/zod-config) | ⭐️ 89 | Load configurations across multiple sources with flexible adapters, ensuring type safety with Zod. |

## [Zod Utilities](https://v4.zod.dev/ecosystem\#zod-utilities)

| Name | Stars | Description |
| --- | --- | --- |

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/ecosystem.mdx)

[Next\\
\\
JSON Schema](https://v4.zod.dev/json-schema) [Next\\
\\
zod](https://v4.zod.dev/packages/zod)

# zod

The `zod` package is the "flagship" library of the Zod ecosystem. It strikes a balance between developer experience and bundle size that's ideal for the vast majority of applications.

If you have uncommonly strict constraints around bundle size, consider [`@zod/mini`](https://v4.zod.dev/packages/mini).

Zod aims to provide a schema API that maps one-to-one to TypeScript's type system.

```
import * as z from "zod/v4";

const schema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  email: z.string().email(),
});
```

The API relies on methods to provide a concise, chainable, autocomplete-friendly way to define complex types.

```
z.string()
  .min(5)
  .max(10)
  .toLowerCase();
```

All schemas extend the `z.ZodType` base class, which in turn extends `z.$ZodType` from [`@zod/core`](https://v4.zod.dev/packages/core). All instance of `ZodType` implement the following methods:

```
import * as z from "zod/v4";

const mySchema = z.string();

// parsing
mySchema.parse(data);
mySchema.safeParse(data);
mySchema.parseAsync(data);
mySchema.safeParseAsync(data);


// refinements
mySchema.refine(refinementFunc);
mySchema.superRefine(refinementFunc); // deprecated, use `.check()`
mySchema.overwrite(overwriteFunc);

// wrappers
mySchema.optional();
mySchema.nonoptional();
mySchema.nullable();
mySchema.nullish();
mySchema.default(defaultValue);
mySchema.array();
mySchema.or(otherSchema);
mySchema.transform(transformFunc);
mySchema.catch(catchValue);
mySchema.pipe(otherSchema);
mySchema.readonly();

// metadata and registries
mySchema.register(registry, metadata);
mySchema.describe(description);
mySchema.meta(metadata);

// utilities
mySchema.check(checkOrFunction);
mySchema.clone(def);
mySchema.brand<T>();
mySchema.isOptional(); // boolean
mySchema.isNullable(); // boolean
```

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/packages/zod.mdx)

[Next\\
\\
Ecosystem](https://v4.zod.dev/ecosystem) [Next\\
\\
@zod/mini](https://v4.zod.dev/packages/mini)

# @zod/mini

The `@zod/mini` library was introduced with the release of Zod 4.

```
npm install @zod/mini@next
```

It implements the exact same functionality as `zod`, but using a _functional_, _tree-shakable_ API. If you're coming from `zod`, this means you generally will use _functions_ in place of methods.

@zod/minizod

```
import * as z from "zod/v4-mini"

const mySchema = z.nullable(z.optional(z.string()));
```

**Tree-shaking** — In `zod`, schemas provide a range of convenience methods to perform some common operations (e.g. `.min()` on string schemas). Bundlers have a hard time removing ("tree shaking") method implementations from your bundle, even if they aren't used. It's much easier to remove an unused top-level function, which is why the API of `@zod/mini` uses more functions than methods.

## [`ZodMiniType`](https://v4.zod.dev/packages/mini\#zodminitype)

All `@zod/mini` schemas extend the `z.ZodMiniType` base class, which in turn extends `z.core.$ZodType` from [`@zod/core`](https://v4.zod.dev/packages/core). While this class implements far fewer methods than `ZodType` in `zod`, some particularly useful methods remain.

### [`.parse`](https://v4.zod.dev/packages/mini\#parse)

This is an obvious one. All `@zod/mini` schemas implement the same parsing methods as `zod`.

```
import * as z from "zod/v4-mini"

const mySchema = z.string();

mySchema.parse('asdf')
await mySchema.parseAsync('asdf')
mySchema.safeParse('asdf')
await mySchema.safeParseAsync('asdf')
```

### [`.check()`](https://v4.zod.dev/packages/mini\#check)

In `zod` there are dedicated methods on schema subclasses for performing common checks:

```
import * as z from "zod/v4";

z.string()
  .min(5)
  .max(10)
  .refine(val => val.includes("@"))
  .trim()
```

In `@zod/mini` such methods aren't implemented. Instead you pass these checks into schemas using the `.check()` method:

```
import * as z from "zod/v4-mini"

z.string().check(
  z.minLength(5),
  z.maxLength(10),
  z.refine(val => val.includes("@")),
  z.trim()
);
```

The following checks are implemented. Some of these checks only apply to schemas of certain types (e.g. strings or numbers). The APIs are all type-safe; TypeScript won't let you add an unsupported check to your schema.

```
z.lt(value);
z.lte(value); // alias: z.maximum()
z.gt(value);
z.gte(value); // alias: z.minimum()
z.positive();
z.negative();
z.nonpositive();
z.nonnegative();
z.multipleOf(value);
z.maxSize(value);
z.minSize(value);
z.size(value);
z.maxLength(value);
z.minLength(value);
z.length(value);
z.regex(regex);
z.lowercase();
z.uppercase();
z.includes(value);
z.startsWith(value);
z.endsWith(value);
z.property(key, schema);
z.mime(value);

// custom checks
z.refine()
z.check()   // replaces .superRefine()

// mutations (these do not change the inferred types)
z.overwrite(value => newValue);
z.normalize();
z.trim();
z.toLowerCase();
z.toUpperCase();
```

### [`.register()`](https://v4.zod.dev/packages/mini\#register)

For registering a schema in a [registry](https://v4.zod.dev/metadata#registries).

```
const myReg = z.registry<{title: string}>();

z.string().register(myReg, { title: "My cool string schema" });
```

### [`.brand()`](https://v4.zod.dev/packages/mini\#brand)

For _branding_ a schema. Refer to the [Branded types](https://v4.zod.dev/api#branded-types) docs for more information.

```
import * as z from "zod/v4-mini"

const USD = z.string().brand("USD");
```

### [`.clone(def)`](https://v4.zod.dev/packages/mini\#clonedef)

Returns an identical clone of the current schema using the provided `def`.

```
const mySchema = z.string()

mySchema.clone(mySchema._zod.def);
```

## [No default locale](https://v4.zod.dev/packages/mini\#no-default-locale)

While `zod` automatically loads the English ( `en`) locale, `@zod/mini` does not. This reduces the bundle size in scenarios where error messages are unnecessary, localized to a non-English language, or otherwise customized.

This means, by default the `message` property of all issues will simply read `"Invalid input"`. To load the English locale:

```
import * as z from "zod/v4-mini"

z.config(z.locales.en());
```

Refer to the [Locales](https://v4.zod.dev/error-customization#internationalization) docs for more on localization.

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/packages/mini.mdx)

[Next\\
\\
zod](https://v4.zod.dev/packages/zod) [Next\\
\\
@zod/core](https://v4.zod.dev/packages/core)

# @zod/core

This page is primarily intended for consumption by _library authors_ who are building tooling on top of Zod.

## [What's in `@zod/core`](https://v4.zod.dev/packages/core\#whats-in-zodcore)

This package exports the core classes and utilities that are consumed by `zod` and `@zod/mini`. It is not intended to be used directly; instead it's designed to be extended by other packages. It implements:

```
import * as z from "zod/v4/core";

// the base class for all Zod schemas
z.$ZodType;

// subclasses of $ZodType that implement common parsers
z.$ZodString
z.$ZodObject
z.$ZodArray
// ...

// the base class for all Zod checks
z.$ZodCheck;

// subclasses of $ZodCheck that implement common checks
z.$ZodCheckMinLength
z.$ZodCheckMaxLength

// the base class for all Zod errors
z.$ZodError;

// issue formats (types only)
{} as z.$ZodIssue;

// utils
z.util.isValidJWT(...);
```

For simplicity, the `zod` and `@zod/mini` packages re-export their `@zod/core` dependency as `z.core`, but you shouldn't rely on this.

```
import * as z from "zod/v4";

z.core.$ZodString;
// the base class for string schemas
```

## [Schemas](https://v4.zod.dev/packages/core\#schemas)

The base class for all Zod schemas is `$ZodType`. It accepts two generic parameters: `Output` and `Input`.

```
export class $ZodType<Output = unknown, Input = unknown> {
  _zod: { /* internals */}
}
```

`@zod/core` exports a number of subclasses that implement some common parsers. A union of all first-party subclasses is exported as `z.$ZodTypes`.

```
export type $ZodTypes =
  | $ZodString
  | $ZodNumber
  | $ZodBigInt
  | $ZodBoolean
  | $ZodDate
  | $ZodSymbol
  | $ZodUndefined
  | $ZodNullable
  | $ZodNull
  | $ZodAny
  | $ZodUnknown
  | $ZodNever
  | $ZodVoid
  | $ZodArray
  | $ZodObject
  | $ZodUnion
  | $ZodIntersection
  | $ZodTuple
  | $ZodRecord
  | $ZodMap
  | $ZodSet
  | $ZodLiteral
  | $ZodEnum
  | $ZodPromise
  | $ZodLazy
  | $ZodOptional
  | $ZodDefault
  | $ZodTemplateLiteral
  | $ZodCustom
  | $ZodTransform
  | $ZodNonOptional
  | $ZodReadonly
  | $ZodNaN
  | $ZodPipe
  | $ZodSuccess
  | $ZodCatch
  | $ZodFile;
```

All `@zod/core` subclasses only contain a single property: `_zod`. This property is an object containing the schemas _internals_. The goal is to make `@zod/core` as extensible and unopinionated as possible. Other libraries can "build their own Zod" on top of these classes without `@zod/core` cluttering up the interface.

Refer to the implementations of `zod` and `@zod/mini` for examples of how to extend these classes.

The `_zod` internals property contains some notable properties:

- `.def` — The schema's _definition_: this is the object you pass into the class's constructor to create an instance. It completely describes the schema, and it's JSON-serializable.
  - `.def.type` — A string representing the schema's type, e.g. `"string"`, `"object"`, `"array"`, etc.
  - `.def.checks` — An array of _checks_ that are executed by the schema after parsing.
- `.input` — A virtual property that "stores" the schema's _inferred input type_.
- `.output` — A virtual property that "stores" the schema's _inferred output type_.
- `.run()` — The schema's internal parser implementation.

If you are implementing a tool (say, a code generator) that must traverse Zod schemas, you can cast any schema to `$ZodTypes` and use the `def` property to discriminate between these classes.

```
export function walk(_schema: z.$ZodType) {
  const schema = _schema as z.$ZodTypes;
  const def = schema._zod.def;
  switch (def.type) {
    case "string": {
      // ...
      break;
    }
    case "object": {
      // ...
      break;
    }
  }
}
```

There are a number of subclasses of `$ZodString` that implement various _string formats_. These are exported as `z.$ZodStringFormatTypes`.

```
export type $ZodStringFormatTypes =
  | $ZodGUID
  | $ZodUUID
  | $ZodEmail
  | $ZodURL
  | $ZodEmoji
  | $ZodNanoID
  | $ZodCUID
  | $ZodCUID2
  | $ZodULID
  | $ZodXID
  | $ZodKSUID
  | $ZodISODateTime
  | $ZodISODate
  | $ZodISOTime
  | $ZodISODuration
  | $ZodIPv4
  | $ZodIPv6
  | $ZodCIDRv4
  | $ZodCIDRv6
  | $ZodBase64
  | $ZodBase64URL
  | $ZodE164
  | $ZodJWT
```

## [Checks](https://v4.zod.dev/packages/core\#checks)

Every Zod schema contains an array of _checks_. These perform post-parsing refinements (and occasionally mutations) that _do not affect_ the inferred type.

```
const schema = z.string().check(z.email()).check(z.min(5));
// => $ZodString

schema._zod.def.checks;
// => [$ZodCheckEmail, $ZodCheckMinLength]
```

The base class for all Zod checks is `$ZodCheck`. It accepts a single generic parameter `T`.

```
export class $ZodCheck<in T = unknown> {
  _zod: { /* internals */}
}
```

The `_zod` internals property contains some notable properties:

- `.def` — The check's _definition_: this is the object you pass into the class's constructor to create the check. It completely describes the check, and it's JSON-serializable.
  - `.def.check` — A string representing the check's type, e.g. `"min_lenth"`, `"less_than"`, `"string_format"`, etc.
- `.check()` — Contains the check's validation logic.

`@zod/core` exports a number of subclasses that perform some common refinements. All first-party subclasses are exported as a union called `z.$ZodChecks`.

```
export type $ZodChecks =
  | $ZodCheckLessThan
  | $ZodCheckGreaterThan
  | $ZodCheckMultipleOf
  | $ZodCheckNumberFormat
  | $ZodCheckBigIntFormat
  | $ZodCheckMaxSize
  | $ZodCheckMinSize
  | $ZodCheckSizeEquals
  | $ZodCheckMaxLength
  | $ZodCheckMinLength
  | $ZodCheckLengthEquals
  | $ZodCheckProperty
  | $ZodCheckMimeType
  | $ZodCheckOverwrite
  | $ZodCheckStringFormat
```

You can use the `._zod.def.check` property to discriminate between these classes.

```
const check = {} as z.$ZodChecks;
const def = check._zod.def;

switch (def.check) {
  case "less_than":
  case "greater_than":
    // ...
    break;
}
```

As with schema types, there are a number of subclasses of `$ZodCheckStringFormat` that implement various _string formats_.

```
export type $ZodStringFormatChecks =
  | $ZodCheckRegex
  | $ZodCheckLowerCase
  | $ZodCheckUpperCase
  | $ZodCheckIncludes
  | $ZodCheckStartsWith
  | $ZodCheckEndsWith
  | $ZodGUID
  | $ZodUUID
  | $ZodEmail
  | $ZodURL
  | $ZodEmoji
  | $ZodNanoID
  | $ZodCUID
  | $ZodCUID2
  | $ZodULID
  | $ZodXID
  | $ZodKSUID
  | $ZodISODateTime
  | $ZodISODate
  | $ZodISOTime
  | $ZodISODuration
  | $ZodIPv4
  | $ZodIPv6
  | $ZodCIDRv4
  | $ZodCIDRv6
  | $ZodBase64
  | $ZodBase64URL
  | $ZodE164
  | $ZodJWT;
```

Use a nested `switch` to discriminate between the different string format checks.

```
const check = {} as z.$ZodChecks;
const def = check._zod.def;

switch (def.check) {
  case "less_than":
  case "greater_than":
  // ...
  case "string_format":
    {
      const formatCheck = check as z.$ZodStringFormatChecks;
      const formatCheckDef = formatCheck._zod.def;

      switch (formatCheckDef.format) {
        case "email":
        case "url":
          // do stuff
      }
    }
    break;
}
```

You'll notice some of these string format _checks_ overlap with the string format _types_ above. That's because these classes implement both the `$ZodCheck` and `$ZodType` interfaces. That is, they can be used as either a check or a type. In these cases, both `._zod.parse` (the schema parser) and `._zod.check` (the check validation) are executed during parsing. In effect, the instance is prepended to its own `checks` array (though it won't actually exist in `._zod.def.checks`).

```
// as a type
z.email().parse("user@example.com");

// as a check
z.string().check(z.email()).parse("user@example.com")
```

## [Errors](https://v4.zod.dev/packages/core\#errors)

The base class for all errors in Zod is `$ZodError`.

For performance reasons, `$ZodError` _does not_ extend the built-in `Error` class! So using `instanceof Error` will return `false`.

- The `zod` package implements a subclass of `$ZodError` called `ZodError` with some additional convenience methods.
- The `@zod/mini` package directly uses `$ZodError`

```
export class $ZodError<T = unknown> implements Error {
 public issues: $ZodIssue[];
}
```

## [Issues](https://v4.zod.dev/packages/core\#issues)

The `issues` property corresponds to an array of `$ZodIssue` objects. All issues extend the `z.$ZodIssueBase` interface.

```
export interface $ZodIssueBase {
  readonly code?: string;
  readonly input?: unknown;
  readonly path: PropertyKey[];
  readonly message: string;
}
```

Zod defines the following issue subtypes:

```
export type $ZodIssue =
  | $ZodIssueInvalidType
  | $ZodIssueTooBig
  | $ZodIssueTooSmall
  | $ZodIssueInvalidStringFormat
  | $ZodIssueNotMultipleOf
  | $ZodIssueUnrecognizedKeys
  | $ZodIssueInvalidUnion
  | $ZodIssueInvalidKey
  | $ZodIssueInvalidElement
  | $ZodIssueInvalidValue
  | $ZodIssueCustom;
```

For details on each type, refer to [the implementation](https://github.com/colinhacks/zod/blob/v4/packages/core/src/errors.ts).

## [Building on top of Zod](https://v4.zod.dev/packages/core\#building-on-top-of-zod)

If you are a library author and think this page should include some additional guidance, please open an issue!

### [Standard Schema](https://v4.zod.dev/packages/core\#standard-schema)

First things first, make sure you need to depend on Zod at all.

If you're building a library that accepts user-defined schemas to perform black-box validation, you may not need to integrate with `zod` specifically. Instead look into [Standard Schema](https://standardschema.dev/). It's a shared interface implemented by most popular validation libraries in the TypeScript ecosystem (see the [full list](https://standardschema.dev/#what-schema-libraries-implement-the-spec)), including Zod.

This spec works great if you accept user-defined schemas and treat them like "black box" validators. Given any compliant library, you can extract inferred input/output types, validate inputs, and get back a standardized error.

If you need Zod specific functionality, read on.

### [Peer dependencies](https://v4.zod.dev/packages/core\#peer-dependencies)

Generally speaking, any library built on top of Zod should include `zod` in `"peerDependencies"`. This lets your users "bring their own Zod".

```
// package.json
{
  // ...
  "peerDependencies": {
    "zod": "^3.0.0"
  }
}
```

When your user installs `zod` or `@zod/mini`, their package manager will automatically install `@zod/core` too. So this peer dependency will be met as long as your user has one of these packages installed.

### [Versioning](https://v4.zod.dev/packages/core\#versioning)

While Zod 4 is in beta, the [`@zod/core`](https://www.npmjs.com/package/@zod/core) package is published as `latest` in the `v0.x` range ("initial development" according to semver). The `v1.0.0` release will accompany the first stable release of `zod@4.0`.

| Version | Semver Range | Description |
| --- | --- | --- |
| Beta | `@zod/core@^0.0.1` | Versions will say in `v0.x` range during the beta |
| Stable | `@zod/core@^1.0.0` | It will go stable alongside `zod@4`. At this point, you'll need to bump the version to `^1.0.0`. |

If Zod isn't _always_ needed for your library (say, if you are building a framework that supports a number of different schema libraries), use `"peerDependenciesMeta"` to mark `@zod/core` as optional.

```
// package.json
{
  // ...
  "peerDependencies": {
    "@zod/core": "^0.0.1"
  },
  "peerDependenciesMeta": {
    "@zod/core": {
      "optional": true
    }
  }
}
```

### [Dev dependencies (local development)](https://v4.zod.dev/packages/core\#dev-dependencies-local-development)

During development, you need to meet your own peer dependency requirement, so you should also add `@zod/core` to your `"devDependencies"`.

```
// package.json
{
  "peerDependencies": {
    "@zod/core": "^0.0.1"
  },
  "devDependencies": {
    "@zod/core": "^0.0.1"
  }
}
```

### [Future proofing](https://v4.zod.dev/packages/core\#future-proofing)

To future-proof your library, you should always allow for new schema and check classes to be added in the future. If you are using switch statements to discriminate over union types, consider printing a warning when an unknown schema type is encountered.

```
const schema = {} as z.$ZodTypes;
const def = schema._zod.def;
switch (def.type) {
  case "string":
    // ...
    break;
  case "object":
    // ...
    break;
  default:
    console.warn(`Unknown schema type: ${def.type}`);
    // reasonable fallback behavior
}
```

If instead you `throw` an error in the default case, your library will be unusable if/when new schemas types are added in the future. Best to print a warning and treat it as a "no-op" (or some other reasonable fallback behavior). The same applies to unrecognized check types, string formats, etc.

[Edit on GitHub](https://github.com/colinhacks/zod/blob/v4/packages/docs/content/packages/core.mdx)

[Next\\
\\
@zod/mini](https://v4.zod.dev/packages/mini)