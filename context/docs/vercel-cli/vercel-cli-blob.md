# vercel blob

The `vercel blob` command is used to interact with [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage, providing functionality to upload, list, delete, and copy files, as well as manage Blob stores.

For more information about Vercel Blob, see the [Vercel Blob documentation](https://vercel.com/docs/storage/vercel-blob) and [Vercel Blob SDK reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk).

## [Usage](https://vercel.com/docs/cli/blob#usage)

The `vercel blob` command supports the following operations:

- [`list`](./vercel-cli-blob.md#list-ls) \- List all files in the Blob store
- [`put`](./vercel-cli-blob.md#put) \- Upload a file to the Blob store
- [`del`](./vercel-cli-blob.md#del) \- Delete a file from the Blob store
- [`copy`](./vercel-cli-blob.md#copy-cp) \- Copy a file in the Blob store
- [`store add`](./vercel-cli-blob.md#store-add) \- Add a new Blob store
- [`store remove`](./vercel-cli-blob.md#store-remove-rm) \- Remove a Blob store
- [`store get`](./vercel-cli-blob.md#store-get) \- Get a Blob store

For authentication, the CLI reads the `BLOB_READ_WRITE_TOKEN` value from your env file, or you can use the [`--rw-token` option](./vercel-cli-blob.md#rw-token).

### [list (ls)](https://vercel.com/docs/cli/blob#list-ls)

terminal

```code-block_code__isn_V
vercel blob list
```

Using the `vercel blob list` command to list all files
in the Blob store.

### [put](https://vercel.com/docs/cli/blob#put)

terminal

```code-block_code__isn_V
vercel blob put [path-to-file]
```

Using the `vercel blob put` command to upload a file to
the Blob store.

### [del](https://vercel.com/docs/cli/blob#del)

terminal

```code-block_code__isn_V
vercel blob del [url-or-pathname]
```

Using the `vercel blob del` command to delete a file
from the Blob store.

### [copy (cp)](https://vercel.com/docs/cli/blob#copy-cp)

terminal

```code-block_code__isn_V
vercel blob copy [from-url-or-pathname] [to-pathname]
```

Using the `vercel blob copy` command to copy a file in
the Blob store.

### [store add](https://vercel.com/docs/cli/blob#store-add)

terminal

```code-block_code__isn_V
vercel blob store add [name] [--region <region>]
```

Using the `vercel blob store add` command to add a new
Blob store. The default region is set to `iad1` when not specified.

### [store remove (rm)](https://vercel.com/docs/cli/blob#store-remove-rm)

terminal

```code-block_code__isn_V
vercel blob store remove [store-id]
```

Using the `vercel blob store remove` command to remove
a Blob store.

### [store get](https://vercel.com/docs/cli/blob#store-get)

terminal

```code-block_code__isn_V
vercel blob store get [store-id]
```

Using the `vercel blob store get` command to get a Blob
store.

## [Unique Options](https://vercel.com/docs/cli/blob#unique-options)

These are options that only apply to the `vercel blob` command.

### [Rw token](https://vercel.com/docs/cli/blob#rw-token)

You can use the `--rw-token` option to specify your Blob read-write token.

terminal

```code-block_code__isn_V
vercel blob put image.jpg --rw-token [rw-token]
```

Using the `vercel blob put` command with the
`--rw-token` option.

### [Limit](https://vercel.com/docs/cli/blob#limit)

You can use the `--limit` option to specify the number of results to return per page when using `list`. The default value is `10` and the maximum is `1000`.

terminal

```code-block_code__isn_V
vercel blob list --limit 100
```

Using the `vercel blob list` command with the
`--limit` option.

### [Cursor](https://vercel.com/docs/cli/blob#cursor)

You can use the `--cursor` option to specify the cursor from a previous page to start listing from.

terminal

```code-block_code__isn_V
vercel blob list --cursor [cursor-value]
```

Using the `vercel blob list` command with the
`--cursor` option.

### [Prefix](https://vercel.com/docs/cli/blob#prefix)

You can use the `--prefix` option to filter Blobs by a specific prefix.

terminal

```code-block_code__isn_V
vercel blob list --prefix images/
```

Using the `vercel blob list` command with the
`--prefix` option.

### [Mode](https://vercel.com/docs/cli/blob#mode)

You can use the `--mode` option to filter Blobs by either folded or expanded mode. The default is `expanded`.

terminal

```code-block_code__isn_V
vercel blob list --mode folded
```

Using the `vercel blob list` command with the
`--mode` option.

### [Add Random Suffix](https://vercel.com/docs/cli/blob#add-random-suffix)

You can use the `--add-random-suffix` option to add a random suffix to the file name when using `put` or `copy`.

terminal

```code-block_code__isn_V
vercel blob put image.jpg --add-random-suffix
```

Using the `vercel blob put` command with the
`--add-random-suffix` option.

### [Pathname](https://vercel.com/docs/cli/blob#pathname)

You can use the `--pathname` option to specify the pathname to upload the file to. The default is the filename.

terminal

```code-block_code__isn_V
vercel blob put image.jpg --pathname assets/images/hero.jpg
```

Using the `vercel blob put` command with the
`--pathname` option.

### [Content Type](https://vercel.com/docs/cli/blob#content-type)

You can use the `--content-type` option to overwrite the content-type when using `put` or `copy`. It will be inferred from the file extension if not provided.

terminal

```code-block_code__isn_V
vercel blob put data.txt --content-type application/json
```

Using the `vercel blob put` command with the
`--content-type` option.

### [Cache Control Max Age](https://vercel.com/docs/cli/blob#cache-control-max-age)

You can use the `--cache-control-max-age` option to set the `max-age` of the cache-control header directive when using `put` or `copy`. The default is `2592000` (30 days).

terminal

```code-block_code__isn_V
vercel blob put image.jpg --cache-control-max-age 86400
```

Using the `vercel blob put` command with the
`--cache-control-max-age` option.

### [Force](https://vercel.com/docs/cli/blob#force)

You can use the `--force` option to overwrite the file if it already exists when uploading. The default is `false`.

terminal

```code-block_code__isn_V
vercel blob put image.jpg --force
```

Using the `vercel blob put` command with the
`--force` option.

### [Multipart](https://vercel.com/docs/cli/blob#multipart)

You can use the `--multipart` option to upload the file in multiple small chunks for performance and reliability. The default is `true`.

terminal

```code-block_code__isn_V
vercel blob put large-file.zip --multipart false
```

Using the `vercel blob put` command with the
`--multipart` option.

### [Region](https://vercel.com/docs/cli/blob#region)

You can use the `--region` option to specify the region where your Blob store should be created. The default is `iad1`. This option is only applicable when using the `store add` command.

terminal

```code-block_code__isn_V
vercel blob store add my-store --region sfo1
```

Using the `vercel blob store add` command with the `--region` option.

## [Global Options](https://vercel.com/docs/cli/blob#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel blob` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
