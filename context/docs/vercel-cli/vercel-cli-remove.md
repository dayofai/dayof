# vercel remove

The `vercel remove` command, which can be shortened to `vercel rm`, is used to remove deployments either by ID or for a specific Vercel Project.

You can also remove deployments from the Project Overview page on the Vercel
Dashboard.

## [Usage](https://vercel.com/docs/cli/remove\#usage)

terminal

```code-block_code__isn_V
vercel remove [deployment-url]
```

Using the `vercel remove` command to remove a
deployment from the Vercel platform.

## [Extended Usage](https://vercel.com/docs/cli/remove\#extended-usage)

terminal

```code-block_code__isn_V
vercel remove [deployment-url-1 deployment-url-2]
```

Using the `vercel remove` command to remove multiple
deployments from the Vercel platform.

terminal

```code-block_code__isn_V
vercel remove [project-name]
```

Using the `vercel remove` command to remove all
deployments for a Vercel Project from the Vercel platform.

By using the [project name](https://vercel.com/docs/projects/overview), the entire Vercel
Project will be removed from the current scope unless the
`--safe` is used.

## [Unique Options](https://vercel.com/docs/cli/remove\#unique-options)

These are options that only apply to the `vercel remove` command.

### [Safe](https://vercel.com/docs/cli/remove\#safe)

The `--safe` option, shorthand `-s`, can be used to skip the removal of deployments with an active preview URL or production domain when a Vercel Project is provided as the parameter.

terminal

```code-block_code__isn_V
vercel remove my-project --safe
```

Using the `vercel remove` command with the
`--safe` option.

### [Yes](https://vercel.com/docs/cli/remove\#yes)

The `--yes` option, shorthand `-y`, can be used to skip the confirmation step for a deployment or Vercel Project removal.

terminal

```code-block_code__isn_V
vercel remove my-deployment.com --yes
```

Using the `vercel remove` command with the
`--yes` option.

## [Global Options](https://vercel.com/docs/cli/remove\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel remove` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
