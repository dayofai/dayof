# vercel logs

The `vercel logs` command displays and follows runtime logs data for a specific deployment.
[Runtime logs](https://vercel.com/docs/runtime-logs) are produced by [Middleware](https://vercel.com/docs/routing-middleware) and [Vercel Functions](https://vercel.com/docs/functions).
You can find more detailed runtime logs on the [Logs](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Flogs&title=Open+Logs) page from the Vercel Dashboard.

From the moment you run this command, all newly emitted logs will display in your terminal, for up to 5 minutes, unless you interrupt it.

Logs are pretty-printed by default, but you can use the `--json` option to display them in JSON format, which makes the output easier to parse programmatically.

## [Usage](https://vercel.com/docs/cli/logs\#usage)

terminal

```code-block_code__isn_V
vercel logs [deployment-url | deployment-id]
```

Using the `vercel logs` command to retrieve runtime
logs for a specific deployment.

## [Unique options](https://vercel.com/docs/cli/logs\#unique-options)

These are options that only apply to the `vercel logs` command.

### [Json](https://vercel.com/docs/cli/logs\#json)

The `--json` option, shorthand `-j`, changes the format of the logs output from pretty print to JSON objects.
This makes it possible to pipe the output to other command-line tools, such as [jq](https://jqlang.github.io/jq/), to perform your own filtering and formatting.

terminal

```code-block_code__isn_V
vercel logs [deployment-url | deployment-id] --json | jq 'select(.level == "warning")'
```

Using the `vercel logs` command with the
`--json` option, together with
`jq`, to display only warning logs.

### [Follow](https://vercel.com/docs/cli/logs\#follow)

The `--follow` option has been deprecated since it's
now the default behavior.

The `--follow` option, shorthand `-f`, can be used to watch for additional logs output.

### [Limit](https://vercel.com/docs/cli/logs\#limit)

The `--limit` option has been deprecated as the command
displays all newly emitted logs by default.

The `--limit` option, shorthand `-n`, can be used to specify the number of log lines to output.

### [Output](https://vercel.com/docs/cli/logs\#output)

The `--output` option has been deprecated in favor of
the `--json` option.

The `--output` option, shorthand `-o`, can be used to specify the format of the logs output, this can be either `short` (default) or `raw`.

### [Since](https://vercel.com/docs/cli/logs\#since)

The `--since` option has been deprecated. Logs are
displayed from when you started the command.

The `--since` option can be used to return logs only after a specific date, using the ISO 8601 format.

### [Until](https://vercel.com/docs/cli/logs\#until)

The `--since` option has been deprecated. Logs are
displayed until the command is interrupted, either by you or after 5 minutes.

The `--until` option can be used to return logs only up until a specific date, using the ISO 8601 format.

## [Global Options](https://vercel.com/docs/cli/logs\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel logs` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
