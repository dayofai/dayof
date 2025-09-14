# vercel list

The `vercel list` command, which can be shortened to `vercel ls`, provides a list of recent deployments for the currently-linked Vercel Project.

## [Usage](https://vercel.com/docs/cli/list\#usage)

terminal

```code-block_code__isn_V
vercel list
```

Using the `vercel list` command to retrieve information
about multiple deployments for the currently-linked Vercel Project.

## [Extended Usage](https://vercel.com/docs/cli/list\#extended-usage)

terminal

```code-block_code__isn_V
vercel list [project-name]
```

Using the `vercel list` command to retrieve information
about deployments for a specific Vercel Project.

terminal

```code-block_code__isn_V
vercel list [project-name] [--meta foo=bar]
```

Using the `vercel list` command to retrieve information
about deployments filtered by metadata.

terminal

```code-block_code__isn_V
vercel list [project-name] [--policy errored=6m]
```

Using the `vercel list` command to retrieve information
about deployments including retention policy.

## [Unique Options](https://vercel.com/docs/cli/list\#unique-options)

These are options that only apply to the `vercel list` command.

### [Meta](https://vercel.com/docs/cli/list\#meta)

The `--meta` option, shorthand `-m`, can be used to filter results based on Vercel deployment metadata.

terminal

```code-block_code__isn_V
vercel list --meta key1=value1 key2=value2
```

Using the `vercel list` command with the
`--meta` option.

To see the meta values for a deployment, use [GET /deployments/{idOrUrl}](https://vercel.com/docs/rest-api/reference/endpoints/deployments/get-a-deployment-by-id-or-url).

### [Policy](https://vercel.com/docs/cli/list\#policy)

The `--policy` option, shorthand `-p`, can be used to display expiration based on [Vercel project deployment retention policy](https://vercel.com/docs/security/deployment-retention).

terminal

```code-block_code__isn_V
vercel list --policy canceled=6m -p errored=6m -p preview=6m -p production=6m
```

Using the `vercel list` command with the
`--policy` option.

### [Yes](https://vercel.com/docs/cli/list\#yes)

The `--yes` option can be used to skip questions you are asked when setting up a new Vercel Project.
The questions will be answered with the default scope and current directory for the Vercel Project name and location.

terminal

```code-block_code__isn_V
vercel list --yes
```

Using the `vercel list` command with the
`--yes` option.

### [environment](https://vercel.com/docs/cli/list\#environment)

Use the `--environment` option to list the deployments for a specific environment. This could be production, preview, or a [custom environment](https://vercel.com/docs/deployments/environments#custom-environments).

terminal

```code-block_code__isn_V
vercel list my-app --environment=staging
```

## [Global Options](https://vercel.com/docs/cli/list\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel list` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
