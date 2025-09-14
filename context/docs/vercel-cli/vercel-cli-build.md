# vercel build

The `vercel build` command can be used to build a Vercel Project locally or in your own CI environment.
Build artifacts are placed into the `.vercel/output` directory according to the
[Build Output API](https://vercel.com/docs/build-output-api/v3).

When used in conjunction with the `vercel deploy --prebuilt` command, this allows a Vercel Deployment
to be created _without_ sharing the Vercel Project's source code with Vercel.

This command can also be helpful in debugging a Vercel Project by receiving error messages for a failed
build locally, or by inspecting the resulting build artifacts to get a better understanding of
how Vercel will create the Deployment.

It is recommended to run the `vercel pull` command before invoking `vercel build` to ensure that
you have the most recent Project Settings and Environment Variables stored locally.

## [Usage](https://vercel.com/docs/cli/build\#usage)

terminal

```code-block_code__isn_V
vercel build
```

Using the `vercel build` command to build a Vercel
Project.

## [Unique Options](https://vercel.com/docs/cli/build\#unique-options)

These are options that only apply to the `vercel build` command.

### [Production](https://vercel.com/docs/cli/build\#production)

The `--prod` option can be specified when you want to build the Vercel Project using Production Environment Variables. By default, the Preview Environment Variables will be used.

terminal

```code-block_code__isn_V
vercel build --prod
```

Using the `vercel build` command with the
`--prod` option.

### [Yes](https://vercel.com/docs/cli/build\#yes)

The `--yes` option can be used to bypass the confirmation prompt and automatically pull environment variables and Project Settings if not found locally.

terminal

```code-block_code__isn_V
vercel build --yes
```

Using the `vercel build` command with the
`--yes` option.

### [target](https://vercel.com/docs/cli/build\#target)

Use the `--target` option to define the environment you want to build against. This could be production, preview, or a [custom environment](https://vercel.com/docs/deployments/environments#custom-environments).

terminal

```code-block_code__isn_V
vercel build --target=staging
```

## [Global Options](https://vercel.com/docs/cli/build\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel build` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).

## [Related guides](https://vercel.com/docs/cli/build\#related-guides)

- [How can I use the Vercel CLI for custom workflows?](https://vercel.com/guides/using-vercel-cli-for-custom-workflows)
