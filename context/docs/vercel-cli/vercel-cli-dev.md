# vercel dev

The `vercel dev` command is used to replicate the Vercel deployment environment locally, allowing you to test your [Vercel Functions](https://vercel.com/docs/functions) and [Middleware](https://vercel.com/docs/routing-middleware) without requiring you to deploy each time a change is made.

If the [Development Command](https://vercel.com/docs/deployments/configure-a-build#development-command) is configured in your Project Settings, it will affect the behavior of `vercel dev` for everyone on that team.

Before running `vercel dev`, make sure to install your
dependencies by running `npm install`.

## [When to Use This Command](https://vercel.com/docs/cli/dev\#when-to-use-this-command)

If you're using a framework and your framework's [Development Command](https://vercel.com/docs/deployments/configure-a-build#development-command) already provides all the features you need, we do not recommend using `vercel dev`.

For example, [Next.js](https://vercel.com/docs/frameworks/nextjs)'s Development Command ( `next dev`) provides native support for Functions, [redirects](https://vercel.com/docs/redirects#configuration-redirects), rewrites, headers and more.

## [Usage](https://vercel.com/docs/cli/dev\#usage)

terminal

```code-block_code__isn_V
vercel dev
```

Using the `vercel dev` command from the root of a
Vercel Project directory.

## [Unique Options](https://vercel.com/docs/cli/dev\#unique-options)

These are options that only apply to the `vercel dev` command.

### [Listen](https://vercel.com/docs/cli/dev\#listen)

The `--listen` option, shorthand `-l`, can be used to specify which port `vercel dev` runs on.

terminal

```code-block_code__isn_V
vercel dev --listen 5005
```

Using the `vercel dev` command with the
`--listen` option.

### [Yes](https://vercel.com/docs/cli/dev\#yes)

The `--yes` option can be used to skip questions you are asked when setting up a new Vercel Project.
The questions will be answered with the default scope and current directory for the Vercel Project name and location.

terminal

```code-block_code__isn_V
vercel dev --yes
```

Using the `vercel dev` command with the
`--yes` option.

## [Global Options](https://vercel.com/docs/cli/dev\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel dev` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
