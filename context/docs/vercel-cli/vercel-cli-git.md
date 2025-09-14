# vercel git

The `vercel git` command is used to manage a Git provider repository for a Vercel Project,
enabling deployments to Vercel through Git.

When run, Vercel CLI searches for a local `.git` config file containing at least one remote URL.
If found, you can connect it to the Vercel Project linked to your directory.

[Learn more about using Git with Vercel](https://vercel.com/docs/git).

## [Usage](https://vercel.com/docs/cli/git\#usage)

terminal

```code-block_code__isn_V
vercel git connect
```

Using the `vercel git` command to connect a Git
provider repository from your local Git config to a Vercel Project.

terminal

```code-block_code__isn_V
vercel git disconnect
```

Using the `vercel git` command to disconnect a
connected Git provider repository from a Vercel Project.

## [Unique Options](https://vercel.com/docs/cli/git\#unique-options)

These are options that only apply to the `vercel git` command.

### [Yes](https://vercel.com/docs/cli/git\#yes)

The `--yes` option can be used to skip connect confirmation.

terminal

```code-block_code__isn_V
vercel git connect --yes
```

Using the `vercel git connect` command with the
`--yes` option.

## [Global Options](https://vercel.com/docs/cli/git\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel git` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
