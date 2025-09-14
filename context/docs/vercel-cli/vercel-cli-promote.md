# vercel promote

The `vercel promote` command is used to promote an existing deployment to be the current deployment.

Deployments built for the Production environment are the typical promote
target. You can promote Deployments built for the Preview environment, but you
will be asked to confirm that action and will result in a new production
deployment. You can bypass this prompt by using the `--yes` option.

## [Usage](https://vercel.com/docs/cli/promote\#usage)

terminal

```code-block_code__isn_V
vercel promote [deployment-id or url]
```

Using `vercel promote` will promote an existing
deployment to be current.

## [Unique Options](https://vercel.com/docs/cli/promote\#unique-options)

These are options that only apply to the `vercel promote` command.

### [Timeout](https://vercel.com/docs/cli/promote\#timeout)

The `--timeout` option is the time that the `vercel promote` command will wait for the promotion to complete. When a timeout occurs, it does not affect the actual promotion which will continue to proceed.

When promoting a deployment, a timeout of `0` will immediately exit after requesting the promotion. The default timeout is `3m`.

terminal

```code-block_code__isn_V
vercel promote https://example-app-6vd6bhoqt.vercel.app --timeout=5m
```

Using the `vercel promote` command with the
`--timeout` option.

## [Global Options](https://vercel.com/docs/cli/promote\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel promote` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
