# vercel inspect

The `vercel inspect` command is used to retrieve information about a deployment referenced either by its deployment URL or ID.

You can use this command to view either a deployment's information or its [build logs](./vercel-cli-inspect.md#logs).

## [Usage](https://vercel.com/docs/cli/inspect\#usage)

terminal

```code-block_code__isn_V
vercel inspect [deployment-id or url]
```

Using the `vercel inspect` command to retrieve
information about a specific deployment.

## [Unique Options](https://vercel.com/docs/cli/inspect\#unique-options)

These are options that only apply to the `vercel inspect` command.

### [Timeout](https://vercel.com/docs/cli/inspect\#timeout)

The `--timeout` option sets the time to wait for deployment completion. It defaults to 3 minutes.

Any valid time string for the [ms](https://www.npmjs.com/package/ms) package can be used.

terminal

```code-block_code__isn_V
vercel inspect https://example-app-6vd6bhoqt.vercel.app --timeout=5m
```

Using the `vercel inspect` command with the
`--timeout` option.

### [Wait](https://vercel.com/docs/cli/inspect\#wait)

The `--wait` option will block the CLI until the specified deployment has completed.

terminal

```code-block_code__isn_V
vercel inspect https://example-app-6vd6bhoqt.vercel.app --wait
```

Using the `vercel inspect` command with the
`--wait` option.

### [Logs](https://vercel.com/docs/cli/inspect\#logs)

The `--logs` option, shorthand `-l`, prints the build logs instead of the deployment information.

terminal

```code-block_code__isn_V
vercel inspect https://example-app-6vd6bhoqt.vercel.app --logs
```

Using the `vercel inspect` command with the
`--logs` option, to view available build logs.

If the deployment is queued or canceled, there will be no logs to display.

If the deployment is building, you may want to specify `--wait` option. The command will wait for build completion, and will display build logs as they are emitted.

terminal

```code-block_code__isn_V
vercel inspect https://example-app-6vd6bhoqt.vercel.app --logs --wait
```

Using the `vercel inspect` command with the
`--logs` and `--wait` options,
to view all build logs until the deployement is ready.

## [Global Options](https://vercel.com/docs/cli/inspect\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel inspect` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
