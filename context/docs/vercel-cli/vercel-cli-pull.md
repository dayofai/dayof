# vercel pull

The `vercel pull` command is used to store [Environment Variables](https://vercel.com/docs/environment-variables) and Project Settings in a local cache (under `.vercel/.env.$target.local.`) for offline use of `vercel build` and `vercel dev`. If you aren't using those commands, you don't need to run `vercel pull`.

When environment variables or project settings are updated on Vercel, remember to use `vercel pull` again to update your local environment variable and project settings values under `.vercel/`.

To download [Environment Variables](https://vercel.com/docs/environment-variables) to a specific
file (like `.env`), use [`vercel env   pull`](./vercel-cli-env.md#exporting-development-environment-variables)
instead.

## [Usage](https://vercel.com/docs/cli/pull\#usage)

terminal

```code-block_code__isn_V
vercel pull
```

Using the `vercel pull` fetches the latest
"development" Environment Variables and Project Settings from the cloud.

terminal

```code-block_code__isn_V
vercel pull --environment=preview
```

Using the `vercel pull` fetches the latest "preview"
Environment Variables and Project Settings from the cloud.

terminal

```code-block_code__isn_V
vercel pull --environment=preview --git-branch=feature-branch
```

Using the `vercel pull` fetches the "feature-branch"
Environment Variables and Project Settings from the cloud.

terminal

```code-block_code__isn_V
vercel pull --environment=production
```

Using the `vercel pull` fetches the latest "production"
Environment Variables and Project Settings from the cloud.

## [Unique Options](https://vercel.com/docs/cli/pull\#unique-options)

These are options that only apply to the `vercel pull` command.

### [Yes](https://vercel.com/docs/cli/pull\#yes)

The `--yes` option can be used to skip questions you are asked when setting up a new Vercel Project.
The questions will be answered with the default scope and current directory for the Vercel Project name and location.

terminal

```code-block_code__isn_V
vercel pull --yes
```

Using the `vercel pull` command with the
`--yes` option.

### [environment](https://vercel.com/docs/cli/pull\#environment)

Use the `--environment` option to define the environment you want to pull environment variables from. This could be production, preview, or a [custom environment](https://vercel.com/docs/deployments/environments#custom-environments).

terminal

```code-block_code__isn_V
vercel pull --environment=staging
```

## [Global Options](https://vercel.com/docs/cli/pull\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel pull` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
