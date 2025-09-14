# vercel domains

The `vercel domains` command is used to manage domains under the current scope, providing functionality to list, inspect, add, remove, purchase, move, transfer-in, and verify domains.

You can manage domains with further options and greater control under a Vercel
Project's Domains tab from the Vercel Dashboard.

## [Usage](https://vercel.com/docs/cli/domains\#usage)

terminal

```code-block_code__isn_V
vercel domains ls
```

Using the `vercel domains` command to list all domains
under the current scope.

## [Extended Usage](https://vercel.com/docs/cli/domains\#extended-usage)

terminal

```code-block_code__isn_V
vercel domains inspect [domain]
```

Using the `vercel domains` command to retrieve
information about a specific domain.

terminal

```code-block_code__isn_V
vercel domains add [domain] [project]
```

Using the `vercel domains` command to add a domain to
the current scope or a Vercel Project.

terminal

```code-block_code__isn_V
vercel domains rm [domain]
```

Using the `vercel domains` command to remove a domain
from the current scope.

terminal

```code-block_code__isn_V
vercel domains buy [domain]
```

Using the `vercel domains` command to buy a domain for
the current scope.

terminal

```code-block_code__isn_V
vercel domains move [domain] [scope-name]
```

Using the `vercel domains` command to move a domain to
another scope.

terminal

```code-block_code__isn_V
vercel domains transfer-in [domain]
```

Using the `vercel domains` command to transfer in a
domain to the current scope.

## [Unique Options](https://vercel.com/docs/cli/domains\#unique-options)

These are options that only apply to the `vercel domains` command.

### [Yes](https://vercel.com/docs/cli/domains\#yes)

The `--yes` option can be used to bypass the confirmation prompt when removing a domain.

terminal

```code-block_code__isn_V
vercel domains rm [domain] --yes
```

Using the `vercel domains rm` command with the
`--yes` option.

### [Limit](https://vercel.com/docs/cli/domains\#limit)

The `--limit` option can be used to specify the maximum number of domains returned when using `ls`. The default value to `20` and the maximum is `100`.

terminal

```code-block_code__isn_V
vercel domains ls --limit 100
```

Using the `vercel domains ls` command with the
`--limit` option.

### [Force](https://vercel.com/docs/cli/domains\#force)

The `--force` option forces a domain on a project, removing it from an existing one.

terminal

```code-block_code__isn_V
vercel domains add my-domain.com my-project --force
```

Using the `vercel domains add` command with the
`--force` option.

## [Global Options](https://vercel.com/docs/cli/domains\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel domains` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
