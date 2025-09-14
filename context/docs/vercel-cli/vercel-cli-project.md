# vercel project

The `vercel project` command is used to manage your Vercel Projects, providing functionality to list, add, and remove.

## [Usage](https://vercel.com/docs/cli/project\#usage)

terminal

```code-block_code__isn_V
vercel project ls

# Output as JSON
vercel project ls --json
```

Using the `vercel project` command to list all Vercel
Project.

terminal

```code-block_code__isn_V
vercel project ls --update-required

# Output as JSON
vercel project ls --update-required --json
```

Using the `vercel project` command to list all Vercel
Project that are affected by an upcoming Node.js runtime deprecation.

terminal

```code-block_code__isn_V
vercel project add
```

Using the `vercel project` command to create a new
Vercel Project.

terminal

```code-block_code__isn_V
vercel project rm
```

Using the `vercel project` command to remove a Vercel
Project.

## [Global Options](https://vercel.com/docs/cli/project\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel project` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
