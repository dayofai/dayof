# vercel init

The `vercel init` command is used to initialize [Vercel supported framework](https://vercel.com/docs/frameworks) examples locally from the examples found in the [Vercel examples repository](https://github.com/vercel/vercel/tree/main/examples).

## [Usage](https://vercel.com/docs/cli/init\#usage)

terminal

```code-block_code__isn_V
vercel init
```

Using the `vercel init` command to initialize a Vercel
supported framework example locally. You will be prompted with a list of
supported frameworks to choose from.

## [Extended Usage](https://vercel.com/docs/cli/init\#extended-usage)

terminal

```code-block_code__isn_V
vercel init [framework-name]
```

Using the `vercel init` command to initialize a
specific [framework](https://vercel.com/docs/frameworks) example from the Vercel examples
repository locally.

terminal

```code-block_code__isn_V
vercel init [framework-name] [new-local-directory-name]
```

Using the `vercel init` command to initialize a
specific Vercel framework example locally and rename the directory.

## [Unique Options](https://vercel.com/docs/cli/init\#unique-options)

These are options that only apply to the `vercel env` command.

### [Force](https://vercel.com/docs/cli/init\#force)

The `--force` option, shorthand `-f`, is used to forcibly replace an existing local directory.

terminal

```code-block_code__isn_V
vercel init --force
```

Using the `vercel init` command with the
`--force` option.

terminal

```code-block_code__isn_V
vercel init gatsby my-project-directory --force
```

Using the `vercel init` command with the
`--force` option.

## [Global Options](https://vercel.com/docs/cli/init\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel init` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
