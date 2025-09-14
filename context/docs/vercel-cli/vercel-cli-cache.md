# vercel cache

The `vercel cache` command is used to manage the cache for your project, such as [CDN cache](https://vercel.com/docs/edge-cache) and [Data cache](https://vercel.com/docs/data-cache).

## [Usage](./vercel-cli-cache.md#usage)

terminal

```code-block_code__isn_V
vercel cache purge
```

Using the `vercel cache purge` command to purge the CDN
cache and Data cache.

## [Extended Usage](./vercel-cli-cache.md#extended-usage)

terminal

```code-block_code__isn_V
vercel cache purge --type=cdn
```

Using the `vercel cache purge --type=cdn` command to
purge the CDN cache.

terminal

```code-block_code__isn_V
vercel cache purge --type=data
```

Using the `vercel cache purge --type=data` command to
purge the Data cache.

## [Unique Options](./vercel-cli-cache.md#unique-options)

These are options that only apply to the `vercel cache` command.

### [Yes](./vercel-cli-cache.md#yes)

The `--yes` option can be used to bypass the confirmation prompt when purging the cache.

terminal

```code-block_code__isn_V
vercel cache purge --yes
```

Using the `vercel cache purge` command with the
`--yes` option.

## [Global Options](./vercel-cli-cache.md#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel cache` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
