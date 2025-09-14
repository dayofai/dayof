# vercel redeploy

The `vercel redeploy` command is used to rebuild and [redeploy an existing deployment](https://vercel.com/docs/deployments/managing-deployments).

## [Usage](https://vercel.com/docs/cli/redeploy\#usage)

terminal

```code-block_code__isn_V
vercel redeploy [deployment-id or url]
```

Using `vercel redeploy` will rebuild and deploys an
existing deployment.

## [Standard output usage](https://vercel.com/docs/cli/redeploy\#standard-output-usage)

When redeploying, `stdout` is always the Deployment URL.

terminal

```code-block_code__isn_V
vercel redeploy https://example-app-6vd6bhoqt.vercel.app > deployment-url.txt
```

Using the `vercel redeploy` command to redeploy and
write `stdout` to a text file. When redeploying,
`stdout` is always the Deployment URL.

## [Standard error usage](https://vercel.com/docs/cli/redeploy\#standard-error-usage)

If you need to check for errors when the command is executed such as in a CI/CD workflow,
use `stderr`. If the exit code is anything other than `0`, an error has occurred. The
following example demonstrates a script that checks if the exit code is not equal to 0:

check-redeploy.sh

```code-block_code__isn_V
# save stdout and stderr to files
vercel redeploy https://example-app-6vd6bhoqt.vercel.app >deployment-url.txt 2>error.txt

# check the exit code
code=$?
if [ $code -eq 0 ]; then
    # Now you can use the deployment url from stdout for the next step of your workflow
    deploymentUrl=`cat deployment-url.txt`
    echo $deploymentUrl
else
    # Handle the error
    errorMessage=`cat error.txt`
    echo "There was an error: $errorMessage"
fi
```

## [Unique Options](https://vercel.com/docs/cli/redeploy\#unique-options)

These are options that only apply to the `vercel redeploy` command.

### [No Wait](https://vercel.com/docs/cli/redeploy\#no-wait)

The `--no-wait` option does not wait for a deployment to finish before exiting from the `redeploy` command.

terminal

```code-block_code__isn_V
vercel redeploy https://example-app-6vd6bhoqt.vercel.app --no-wait
```

Using the `vercel redeploy` command with the
`--no-wait` option.

### [target](https://vercel.com/docs/cli/redeploy\#target)

Use the `--target` option to define the environment you want to redeploy to. This could be production, preview, or a [custom environment](https://vercel.com/docs/deployments/environments#custom-environments).

terminal

```code-block_code__isn_V
vercel redeploy https://example-app-6vd6bhoqt.vercel.app --target=staging
```

## [Global Options](https://vercel.com/docs/cli/redeploy\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel redeploy` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
