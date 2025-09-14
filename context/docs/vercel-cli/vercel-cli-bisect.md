# vercel bisect

The `vercel bisect` command can be used to perform a [binary search](https://wikipedia.org/wiki/Binary_search_algorithm) upon a set of deployments in a Vercel Project for the purpose of determining when a bug was introduced.

This is similar to [git bisect](https://git-scm.com/docs/git-bisect) but faster because you don't need to wait to rebuild each commit, as long as there is a corresponding Deployment. The command works by specifing both a _bad_ Deployment and a _good_ Deployment. Then, `vercel bisect` will retrieve all the deployments in between, and step by them one by one. At each step, you will perform your check and specify whether or not the issue you are investigating is present in the Deployment for that step.

Note that if an alias URL is used for either the _good_ or _bad_ deployment, then the URL will be resolved to the current target of the alias URL. So if your Project is currently in promote/rollback state, then the alias URL may not be the newest chronological Deployment.

The good and bad deployments provided to `vercel bisect` must be
production deployments.

## [Usage](https://vercel.com/docs/cli/bisect\#usage)

terminal

```code-block_code__isn_V
vercel bisect
```

Using the `vercel bisect` command will initiate an
interactive prompt where you specify a good deployment, followed by a bad
deployment and step through the deployments in between to find the first bad
deployment.

## [Unique Options](https://vercel.com/docs/cli/bisect\#unique-options)

These are options that only apply to the `vercel bisect` command.

### [Good](https://vercel.com/docs/cli/bisect\#good)

The `--good` option, shorthand `-g`, can be used to specify the initial "good" deployment from the command line. When this option is present, the prompt will be skipped at the beginning of the bisect session. A production alias URL may be specified for convenience.

terminal

```code-block_code__isn_V
vercel bisect --good https://example.com
```

Using the `vercel bisect` command with the
`--good` option.

### [Bad](https://vercel.com/docs/cli/bisect\#bad)

The `--bad` option, shorthand `-b`, can be used to specify the "bad" deployment from the command line. When this option is present, the prompt will be skipped at the beginning of the bisect session. A production alias URL may be specified for convenience.

terminal

```code-block_code__isn_V
vercel bisect --bad https://example-s93n1nfa.vercel.app
```

Using the `vercel bisect` command with the
`--bad` option.

### [Path](https://vercel.com/docs/cli/bisect\#path)

The `--path` option, shorthand `-p`, can be used to specify a subpath of the deployment where the issue occurs. The subpath will be appended to each URL during the bisect session.

terminal

```code-block_code__isn_V
vercel bisect --path /blog/first-post
```

Using the `vercel bisect` command with the
`--path` option.

### [Open](https://vercel.com/docs/cli/bisect\#open)

The `--open` option, shorthand `-o`, will attempt to automatically open each deployment URL in your browser window for convenience.

terminal

```code-block_code__isn_V
vercel bisect --open
```

Using the `vercel bisect` command with the
`--open` option.

### [Run](https://vercel.com/docs/cli/bisect\#run)

The `--run` option, shorthand `-r`, provides the ability for the bisect session to be automated using a shell script or command that will be invoked for each deployment URL. The shell script can run an automated test (for example, using the `curl` command to check the exit code) which the bisect command will use to determine whether each URL is good (exit code 0), bad (exit code non-0), or should be skipped (exit code 125).

terminal

```code-block_code__isn_V
vercel bisect --run ./test.sh
```

Using the `vercel bisect` command with the
`--run` option.

## [Global Options](https://vercel.com/docs/cli/bisect\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel bisect` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).

## [Related guides](https://vercel.com/docs/cli/bisect\#related-guides)

- [How to determine which Vercel Deployment introduced an issue?](https://vercel.com/guides/how-to-determine-which-vercel-deployment-introduced-an-issue)
