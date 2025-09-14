# vercel link

The `vercel link` command links your local directory to a [Vercel Project](https://vercel.com/docs/projects/overview).

## [Usage](https://vercel.com/docs/cli/link\#usage)

terminal

```code-block_code__isn_V
vercel link
```

Using the `vercel link` command to link the current
directory to a Vercel Project.

## [Extended Usage](https://vercel.com/docs/cli/link\#extended-usage)

terminal

```code-block_code__isn_V
vercel link [path-to-directory]
```

Using the `vercel link` command and supplying a path to
the local directory of the Vercel Project.

## [Unique Options](https://vercel.com/docs/cli/link\#unique-options)

These are options that only apply to the `vercel link` command.

### [Repo Alpha](https://vercel.com/docs/cli/link\#repo-alpha)

The `--repo` option can be used to link all projects in your repository to their respective Vercel projects in one command. This command requires that your Vercel projects are using the [Git integration](https://vercel.com/docs/git).

terminal

```code-block_code__isn_V
vercel link --repo
```

Using the `vercel link` command with the `--repo` option.

### [Yes](https://vercel.com/docs/cli/link\#yes)

The `--yes` option can be used to skip questions you are asked when setting up a new Vercel Project.
The questions will be answered with the default scope and current directory for the Vercel Project name and location.

terminal

```code-block_code__isn_V
vercel link --yes
```

Using the `vercel link` command with the
`--yes` option.

### [Project](https://vercel.com/docs/cli/link\#project)

The `--project` option can be used to specify a project name. In non-interactive usage, `--project`
allows you to set a project name that does not match the name of the current working directory.

terminal

```code-block_code__isn_V
vercel link --yes --project foo
```

Using the `vercel link` command with the
`--project` option.

## [Global Options](https://vercel.com/docs/cli/link\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel link` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
