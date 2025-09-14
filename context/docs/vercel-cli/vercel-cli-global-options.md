# Vercel CLI Global Options

Global options are commonly available to use with multiple Vercel CLI commands.

## [Current Working Directory](https://vercel.com/docs/cli/global-options\#current-working-directory)

The `--cwd` option can be used to provide a working directory (that can be different from the current directory) when running Vercel CLI commands.

This option can be a relative or absolute path.

terminal

```code-block_code__isn_V
vercel --cwd ~/path-to/project
```

Using the `vercel` command with the
`--cwd` option.

## [Debug](https://vercel.com/docs/cli/global-options\#debug)

The `--debug` option, shorthand `-d`, can be used to provide a more verbose output when running Vercel CLI commands.

terminal

```code-block_code__isn_V
vercel --debug
```

Using the `vercel` command with the
`--debug` option.

## [Global config](https://vercel.com/docs/cli/global-options\#global-config)

The `--global-config` option, shorthand `-Q`, can be used set the path to the [global configuration directory](https://vercel.com/docs/project-configuration/global-configuration).

terminal

```code-block_code__isn_V
vercel --global-config /path-to/global-config-directory
```

Using the `vercel` command with the
`--global-config` option.

## [Help](https://vercel.com/docs/cli/global-options\#help)

The `--help` option, shorthand `-h`, can be used to display more information about [Vercel CLI](https://vercel.com/cli) commands.

terminal

```code-block_code__isn_V
vercel --help
```

Using the `vercel` command with the
`--help` option.

terminal

```code-block_code__isn_V
vercel alias --help
```

Using the `vercel alias` command with the
`--help` option.

## [Local config](https://vercel.com/docs/cli/global-options\#local-config)

The `--local-config` option, shorthand `-A`, can be used to set the path to a local `vercel.json` file.

terminal

```code-block_code__isn_V
vercel --local-config /path-to/vercel.json
```

Using the `vercel` command with the
`--local-config` option.

## [Scope](https://vercel.com/docs/cli/global-options\#scope)

The `--scope` option, shorthand `-S`, can be used to execute Vercel CLI commands from a scope that’s not currently active.

terminal

```code-block_code__isn_V
vercel --scope my-team-slug
```

Using the `vercel` command with the
`--scope` option.

## [Token](https://vercel.com/docs/cli/global-options\#token)

The `--token` option, shorthand `-t`, can be used to execute Vercel CLI commands with an [authorization token](https://vercel.com/account/tokens).

terminal

```code-block_code__isn_V
vercel --token iZJb2oftmY4ab12HBzyBXMkp
```

Using the `vercel` command with the
`--token` option.

## [No Color](https://vercel.com/docs/cli/global-options\#no-color)

The `--no-color` option, or `NO_COLOR=1` environment variable, can be used to execute Vercel CLI commands with no color or emoji output. This respects the [NO\_COLOR standard](https://no-color.org/).

terminal

```code-block_code__isn_V
vercel login --no-color
```

Using the `vercel` command with the
`--no-color` option.
