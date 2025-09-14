# vercel certs

The `vercel certs` command is used to manage certificates for domains, providing functionality to list, issue, and remove them. Vercel manages certificates for domains automatically.

## [Usage](https://vercel.com/docs/cli/certs\#usage)

terminal

```code-block_code__isn_V
vercel certs ls
```

Using the `vercel certs` command to list all
certificates under the current scope.

## [Extended Usage](https://vercel.com/docs/cli/certs\#extended-usage)

terminal

```code-block_code__isn_V
vercel certs issue [domain1, domain2, domain3]
```

Using the `vercel certs` command to issue certificates
for multiple domains.

terminal

```code-block_code__isn_V
vercel certs rm [certificate-id]
```

Using the `vercel certs` command to remove a
certificate by ID.

## [Unique Options](https://vercel.com/docs/cli/certs\#unique-options)

These are options that only apply to the `vercel certs` command.

### [Challenge Only](https://vercel.com/docs/cli/certs\#challenge-only)

The `--challenge-only` option can be used to only show the challenges needed to issue a certificate.

terminal

```code-block_code__isn_V
vercel certs issue foo.com --challenge-only
```

Using the `vercel certs` command with the
`--challenge-only` option.

### [Limit](https://vercel.com/docs/cli/certs\#limit)

The `--limit` option can be used to specify the maximum number of certs returned when using `ls`. The default value is `20` and the maximum is `100`.

terminal

```code-block_code__isn_V
vercel certs ls --limit 100
```

Using the `vercel certs ls` command with the
`--limit` option.

## [Global Options](https://vercel.com/docs/cli/certs\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel certs` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
