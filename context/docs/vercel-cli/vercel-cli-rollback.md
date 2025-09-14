# vercel rollback

The `vercel rollback` command is used to [roll back production deployments](https://vercel.com/docs/instant-rollback) to previous deployments.

## [Usage](https://vercel.com/docs/cli/rollback\#usage)

terminal

```code-block_code__isn_V
vercel rollback
```

Using `vercel rollback` fetches the status of any
rollbacks in progress.

terminal

```code-block_code__isn_V
vercel rollback [deployment-id or url]
```

Using `vercel rollback` rolls back to previous
deployment.

On the hobby plan, you can only [roll\\
back](https://vercel.com/docs/instant-rollback#who-can-roll-back-deployments) to the previous
production deployment. If you attempt to pass in a deployment id or url from
an earlier deployment, you will be given an error:
`To roll back further than the previous production deployment, upgrade to pro`
.

## [Unique Options](https://vercel.com/docs/cli/rollback\#unique-options)

These are options that only apply to the `vercel rollback` command.

### [Timeout](https://vercel.com/docs/cli/rollback\#timeout)

The `--timeout` option is the time that the `vercel rollback` command will wait for the rollback to complete. It does not affect the actual rollback which will continue to proceed.

When rolling back a deployment, a timeout of `0` will immediately exit after requesting the rollback.

terminal

```code-block_code__isn_V
vercel rollback https://example-app-6vd6bhoqt.vercel.app
```

Using the `vercel rollback` command to the
`https://example-app-6vd6bhoqt.vercel.app` deployment.

## [Global Options](https://vercel.com/docs/cli/rollback\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel rollback` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
