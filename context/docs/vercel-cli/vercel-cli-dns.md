# vercel dns

The `vercel dns` command is used to manage DNS record for domains, providing functionality to list, add, remove, and import records.

When adding DNS records, please wait up to 24 hours for new records to
propagate.

## [Usage](https://vercel.com/docs/cli/dns\#usage)

terminal

```code-block_code__isn_V
vercel dns ls
```

Using the `vercel dns` command to list all DNS records
under the current scope.

## [Extended Usage](https://vercel.com/docs/cli/dns\#extended-usage)

terminal

```code-block_code__isn_V
vercel dns add [domain] [subdomain] [A || AAAA || ALIAS || CNAME || TXT] [value]
```

Using the `vercel dns` command to add an A record for a
subdomain.

terminal

```code-block_code__isn_V
vercel dns add [domain] '@' MX [record-value] [priority]
```

Using the `vercel dns` command to add an MX record for
a domain.

terminal

```code-block_code__isn_V
vercel dns add [domain] [name] SRV [priority] [weight] [port] [target]
```

Using the `vercel dns` command to add an SRV record for
a domain.

terminal

```code-block_code__isn_V
vercel dns add [domain] [name] CAA '[flags] [tag] "[value]"'
```

Using the `vercel dns` command to add a CAA record for
a domain.

terminal

```code-block_code__isn_V
vercel dns rm [record-id]
```

Using the `vercel dns` command to remove a record for a
domain.

terminal

```code-block_code__isn_V
vercel dns import [domain] [path-to-zonefile]
```

Using the `vercel dns` command to import a zonefile for
a domain.

## [Unique Options](https://vercel.com/docs/cli/dns\#unique-options)

These are options that only apply to the `vercel dns` command.

### [Limit](https://vercel.com/docs/cli/dns\#limit)

The `--limit` option can be used to specify the maximum number of dns records returned when using `ls`. The default value is `20` and the maximum is `100`.

terminal

```code-block_code__isn_V
vercel dns ls --limit 100
```

Using the `vercel dns ls` command with the
`--limit` option.

## [Global Options](https://vercel.com/docs/cli/dns\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel dns` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
