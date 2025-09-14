# vercel alias

The `vercel alias` command allows you to apply [custom domains](https://vercel.com/docs/projects/custom-domains) to your deployments.

When a new deployment is created (with our [Git Integration](https://vercel.com/docs/git), Vercel CLI, or the [REST API](https://vercel.com/docs/rest-api)), the platform will automatically apply any [custom domains](https://vercel.com/docs/projects/custom-domains) configured in the project settings.

Any custom domain that doesn't have a [custom preview branch](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch) configured (there can only be one Production Branch and it's [configured separately](https://vercel.com/docs/git#production-branch) in the project settings) will be applied to production deployments created through any of the available sources.

Custom domains that do have a custom preview branch configured, however, only get applied when using the [Git Integration](https://vercel.com/docs/git).

If you're not using the [Git Integration](https://vercel.com/docs/git), `vercel alias` is a great solution if you still need to apply custom domains based on Git branches, or other heuristics.

## [Preferred production commands](https://vercel.com/docs/cli/alias\#preferred-production-commands)

The `vercel alias` command is not the recommended way to promote production deployments to specific domains. Instead, you can use the following commands:

- [`vercel --prod --skip-domain`](./vercel-cli-deploy.md#prod): Use to skip custom domain assignment when deploying to production and creating a staged deployment
- [`vercel promote [deployment-id or url]`](./vercel-cli-promote.md): Use to promote your staged deployment to your custom domains
- [`vercel rollback [deployment-id or url]`](./vercel-cli-rollback.md): Use to alias an earlier production deployment to your custom domains

## [Usage](https://vercel.com/docs/cli/alias\#usage)

In general, the command allows for assigning custom domains to any deployment.

Make sure to not include the HTTP protocol (e.g. `https://`) for the `[custom-domain]` parameter.

terminal

```code-block_code__isn_V
vercel alias set [deployment-url] [custom-domain]
```

Using the `vercel alias` command to assign a custom
domain to a deployment.

terminal

```code-block_code__isn_V
vercel alias rm [custom-domain]
```

Using the `vercel alias` command to remove a custom
domain from a deployment.

terminal

```code-block_code__isn_V
vercel alias ls
```

Using the `vercel alias` command to list custom domains
that were assigned to deployments.

## [Unique options](https://vercel.com/docs/cli/alias\#unique-options)

These are options that only apply to the `vercel alias` command.

### [Yes](https://vercel.com/docs/cli/alias\#yes)

The `--yes` option can be used to bypass the confirmation prompt when removing an alias.

terminal

```code-block_code__isn_V
vercel alias rm [custom-domain] --yes
```

Using the `vercel alias rm` command with the
`--yes` option.

### [Limit](https://vercel.com/docs/cli/alias\#limit)

The `--limit` option can be used to specify the maximum number of aliases returned when using `ls`. The default value is `20` and the maximum is `100`.

terminal

```code-block_code__isn_V
vercel alias ls --limit 100
```

Using the `vercel alias ls` command with the
`--limit` option.

## [Global Options](https://vercel.com/docs/cli/alias\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel alias` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).

## [Related guides](https://vercel.com/docs/cli/alias\#related-guides)

- [How do I resolve alias related errors on Vercel?](https://vercel.com/guides/how-to-resolve-alias-errors-on-vercel)
