# vercel integration

The `vercel integration` command needs to be used with one of the following actions:

- `vercel integration add`
- `vercel integration open`
- `vercel integration list`
- `vercel integration remove`

For the `integration-name` in all the commands below, use the [URL slug](https://vercel.com/docs/integrations/create-integration/submit-integration#url-slug) value of the integration.

## [vercel integration add](https://vercel.com/docs/cli/integration\#vercel-integration-add)

The `vercel integration add` command initializes the setup wizard for creating an integration resource.
This command is used when you want to add a new resource from one of your installed integrations.
This functionality is the same as `vercel install [integration-name]`.

If you have not installed the integration for the resource or accepted the
terms & conditions of the integration through the web UI, this command will
open your browser to the Vercel dashboard and start the installation flow for
that integration.

terminal

```code-block_code__isn_V
vercel integration add [integration-name]
```

Using the `vercel integration add` command to create a new integration
resource

## [vercel integration open](https://vercel.com/docs/cli/integration\#vercel-integration-open)

The `vercel integration open` command opens a deep link into the provider's dashboard for a specific integration. It's useful when you need quick access to the provider's resources from your development environment.

terminal

```code-block_code__isn_V
vercel integration open [integration-name]
```

Using the `vercel integration open` command to open the provider's dashboard

## [vercel integration list](https://vercel.com/docs/cli/integration\#vercel-integration-list)

The `vercel integration list` command displays a list of all installed resources with their associated integrations for the current team or project. It's useful for getting an overview of what integrations are set up in the current scope of your development environment.

terminal

```code-block_code__isn_V
vercel integration list
```

Using the `vercel integration list` command to list the integration resources.

The output shows the name, status, product, and integration for each installed resource.

## [vercel integration remove](https://vercel.com/docs/cli/integration\#vercel-integration-remove)

The `vercel integration remove` command uninstalls the specified integration from your Vercel account. It's useful in automation workflows.

terminal

```code-block_code__isn_V
vercel integration remove [integration-name]
```

Using the `vercel integration remove` command to uninstall an integration

You are required to [remove all installed\\
resources](./vercel-cli-integration-resource.md#vercel-integration-resource-remove)
from this integration before using this command.

## [Global Options](https://vercel.com/docs/cli/integration\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel integration` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
