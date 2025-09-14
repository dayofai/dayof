# vercel install

The `vercel install` command is used to install a [native integration](https://vercel.com/docs/integrations/create-integration#native-integrations) with the option of [adding a product](https://vercel.com/docs/integrations/marketplace-product#create-your-product) to an existing installation.

If you have not installed the integration before, you will asked to open the Vercel dashboard and accept the Vercel Marketplace terms. You can then decide to continue and add a product through the dashboard or cancel the product addition step.

If you have an existing installation with the provider, you can add a product directly from the CLI by answering a series of questions that reflect the choices you would make in the dashboard.

## [Usage](https://vercel.com/docs/cli/install\#usage)

terminal

```code-block_code__isn_V
vercel install acme
```

Using the `vercel install` command install the ACME
integration.

You can get the value of `acme` by looking at the slug of the integration provider from the marketplace URL. For example, for `https://vercel.com/marketplace/gel`, `acme` is `gel`.

## [Global Options](https://vercel.com/docs/cli/install\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel install` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
