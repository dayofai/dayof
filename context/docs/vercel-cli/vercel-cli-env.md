# vercel env

The `vercel env` command is used to manage [Environment Variables](https://vercel.com/docs/environment-variables) of a Project, providing functionality to list, add, remove, and export.

To leverage environment variables in local tools (like `next dev` or `gatsby dev`) that want them in a file (like `.env`), run `vercel env pull <file>`. This will export your Project's environment variables to that file. After updating environment variables on Vercel (through the dashboard, `vercel env add`, or `vercel env rm`), you will have to run `vercel env pull <file>` again to get the updated values.

### [Exporting Development Environment Variables](https://vercel.com/docs/cli/env\#exporting-development-environment-variables)

Some frameworks make use of environment variables during local development through CLI commands like `next dev` or `gatsby dev`. The `vercel env pull` sub-command will export development environment variables to a local `.env` file or a different file of your choice.

terminal

```code-block_code__isn_V
vercel env pull [file]
```

To override environment variable values temporarily, use:

terminal

```code-block_code__isn_V
MY_ENV_VAR="temporary value" next dev
```

If you are using [`vercel build`](./vercel-cli-build.md) or [`vercel dev`](./vercel-cli-dev.md), you should use [`vercel pull`](./vercel-cli-pull.md) instead. Those commands
operate on a local copy of environment variables and Project settings that are
saved under `.vercel/`, which
`vercel pull` provides.

## [Usage](https://vercel.com/docs/cli/env\#usage)

terminal

```code-block_code__isn_V
vercel env ls
```

Using the `vercel env` command to list all Environment
Variables in a Vercel Project.

terminal

```code-block_code__isn_V
vercel env add
```

Using the `vercel env` command to add an Environment
Variable to a Vercel Project.

terminal

```code-block_code__isn_V
vercel env rm
```

Using the `vercel env` command to remove an Environment
Variable from a Vercel Project.

## [Extended Usage](https://vercel.com/docs/cli/env\#extended-usage)

terminal

```code-block_code__isn_V
vercel env ls [environment]
```

Using the `vercel env` command to list Environment
Variables for a specific Environment in a Vercel Project.

terminal

```code-block_code__isn_V
vercel env ls [environment] [gitbranch]
```

Using the `vercel env` command to list Environment
Variables for a specific Environment and Git branch.

terminal

```code-block_code__isn_V
vercel env add [name]
```

Using the `vercel env` command to add an Environment
Variable to all Environments to a Vercel Project.

terminal

```code-block_code__isn_V
vercel env add [name] [environment]
```

Using the `vercel env` command to add an Environment
Variable for a specific Environment to a Vercel Project.

terminal

```code-block_code__isn_V
vercel env add [name] [environment] [gitbranch]
```

Using the `vercel env` command to add an Environment
Variable to a specific Git branch.

terminal

```code-block_code__isn_V
vercel env add [name] [environment] < [file]
```

Using the `vercel env` command to add an Environment
Variable to a Vercel Project using a local file's content as the value.

terminal

```code-block_code__isn_V
echo [value] | vercel env add [name] [environment]
```

Using the `echo` command to generate the value of the
Environment Variable and piping that value into the
`vercel dev` command. Warning: this will save the value
in bash history, so this is not recommend for secrets.

terminal

```code-block_code__isn_V
vercel env add [name] [environment] [gitbranch] < [file]
```

Using the `vercel env` command to add an Environment
Variable with Git branch to a Vercel Project using a local file's content as
the value.

terminal

```code-block_code__isn_V
vercel env rm [name] [environment]
```

Using the `vercel env` command to remove an Environment
Variable from a Vercel Project.

terminal

```code-block_code__isn_V
vercel env pull [file]
```

Using the `vercel env` command to download Development
Environment Variables from the cloud and write to a specific file.

terminal

```code-block_code__isn_V
vercel env pull --environment=preview
```

Using the `vercel env` command to download Preview
Environment Variables from the cloud and write to the
`.env.local` file.

terminal

```code-block_code__isn_V
vercel env pull --environment=preview --git-branch=feature-branch
```

Using the `vercel env` command to download
"feature-branch" Environment Variables from the cloud and write to the
`.env.local` file.

## [Unique Options](https://vercel.com/docs/cli/env\#unique-options)

These are options that only apply to the `vercel env` command.

### [Yes](https://vercel.com/docs/cli/env\#yes)

The `--yes` option can be used to bypass the confirmation prompt when overwriting an environment file or removing an environment variable.

terminal

```code-block_code__isn_V
vercel env pull --yes
```

Using the `vercel env pull` command with the
`--yes` option to overwrite an existing environment
file.

terminal

```code-block_code__isn_V
vercel env rm [name] --yes
```

Using the `vercel env rm` command with the
`--yes` option to skip the remove confirmation.

## [Global Options](https://vercel.com/docs/cli/env\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel env` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
