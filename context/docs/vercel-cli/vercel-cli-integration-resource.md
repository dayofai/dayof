# vercel integration-resource

The `vercel integration-resource` command needs to be used with one of the following actions:

- `vercel integration-resource remove`
- `vercel integration-resource disconnect`

For the `resource-name` in all the commands below, use the [URL slug](https://vercel.com/docs/integrations/create-integration#create-product-form-details) value of the product for this installed resource.

## [vercel integration-resource remove](https://vercel.com/docs/cli/integration-resource\#vercel-integration-resource-remove)

The `vercel integration-resource remove` command uninstalls the product for this resource from the integration.

terminal

```code-block_code__isn_V
vercel integration-resource remove [resource-name] (--disconnect-all)
```

Using the `vercel integration-resource remove` command to uninstall a
resource's product from an integration.

When you include the `--disconnect-all` parameter, all connected projects are disconnected before removal.

## [vercel integration-resource disconnect](https://vercel.com/docs/cli/integration-resource\#vercel-integration-resource-disconnect)

The `vercel integration-resource disconnect` command disconnects a product's resource from a project where it is currently associated.

terminal

```code-block_code__isn_V
vercel integration-resource disconnect [resource-name] (--all)
```

When you include the `--all` parameter, all connected projects are disconnected.

Using the `vercel integration-resource disconnect` command to disconnect a
resource from it's connected project(s)

terminal

```code-block_code__isn_V
vercel integration-resource disconnect [resource-name] [project-name]
```

Using the `vercel integration-resource disconnect` command to disconnect a
resource from a specific connected project where `project-name` is the URL
slug of the project.

## [Global Options](https://vercel.com/docs/cli/integration-resource\#global-options)

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
