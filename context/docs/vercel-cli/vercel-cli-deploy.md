# vercel deploy

The `vercel deploy` command deploys Vercel projects, executable from the project's root directory or by specifying a path. You can omit 'deploy' in `vercel deploy`, as `vercel` is the only command that operates without a subcommand. This document will use 'vercel' to refer to `vercel deploy`.

## [Usage](https://vercel.com/docs/cli/deploy\#usage)

terminal

```code-block_code__isn_V
vercel
```

Using the `vercel` command from the root of a Vercel
project directory.

## [Extended usage](https://vercel.com/docs/cli/deploy\#extended-usage)

terminal

```code-block_code__isn_V
vercel --cwd [path-to-project]
```

Using the `vercel` command and supplying a path to the
root directory of the Vercel project.

terminal

```code-block_code__isn_V
vercel deploy --prebuilt
```

Using the `vercel` command to deploy a prebuilt Vercel
project, typically with `vercel build`. See
[vercel build](./vercel-cli-build.md) and
[Build Output API](https://vercel.com/docs/build-output-api/v3) for more details.

## [Standard output usage](https://vercel.com/docs/cli/deploy\#standard-output-usage)

When deploying, `stdout` is always the Deployment URL.

terminal

```code-block_code__isn_V
vercel > deployment-url.txt
```

Using the `vercel` command to deploy and write
`stdout` to a text file. When deploying,
`stdout` is always the Deployment URL.

### [Deploying to a custom domain](https://vercel.com/docs/cli/deploy\#deploying-to-a-custom-domain)

In the following example, you create a bash script that you include in your CI/CD workflow. The goal is to have all preview deployments be aliased to a custom domain so that developers can bookmark the preview deployment URL. Note that you may need to [define the scope](./vercel-cli-global-options.md#scope) when using `vercel alias`

deployDomain.sh

```code-block_code__isn_V
# save stdout and stderr to files
vercel deploy >deployment-url.txt 2>error.txt

# check the exit code
code=$?
if [ $code -eq 0 ]; then
    # Now you can use the deployment url from stdout for the next step of your workflow
    deploymentUrl=`cat deployment-url.txt`
    vercel alias $deploymentUrl my-custom-domain.com
else
    # Handle the error
    errorMessage=`cat error.txt`
    echo "There was an error: $errorMessage"
fi
```

The script deploys your project and assigns the deployment URL saved in
`stdout` to the custom domain using
`vercel alias`.

## [Standard error usage](https://vercel.com/docs/cli/deploy\#standard-error-usage)

If you need to check for errors when the command is executed such as in a CI/CD workflow,
use `stderr`. If the exit code is anything other than `0`, an error has occurred. The
following example demonstrates a script that checks if the exit code is not equal to 0:

checkDeploy.sh

```code-block_code__isn_V
# save stdout and stderr to files
vercel deploy >deployment-url.txt 2>error.txt

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

## [Unique options](https://vercel.com/docs/cli/deploy\#unique-options)

These are options that only apply to the `vercel` command.

### [Prebuilt](https://vercel.com/docs/cli/deploy\#prebuilt)

The `--prebuilt` option can be used to upload and deploy the results of a previous `vc build` execution located in the .vercel/output directory. See [vercel build](./vercel-cli-build.md) and [Build Output API](https://vercel.com/docs/build-output-api/v3) for more details.

#### [When not to use --prebuilt](https://vercel.com/docs/cli/deploy\#when-not-to-use---prebuilt)

When using the `--prebuilt` flag, no deployment ID will be made available for supported frameworks (like Next.js) to use, which means [Skew Protection](https://vercel.com/docs/skew-protection) will not be enabled. Additionally, [System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables) will be missing at build time, so frameworks that rely on them at build time may not function correctly. If you need Skew Protection or System Environment Variables, do not use the `--prebuilt` flag or use Git-based deployments.

terminal

```code-block_code__isn_V
vercel --prebuilt
```

You should also consider using the [archive](./vercel-cli-deploy.md#archive) option to minimize the number of files uploaded and avoid hitting upload limits:

terminal

```code-block_code__isn_V
# Build the project locally
vercel build

# Deploy the pre-built project, archiving it as a .tgz file
vercel deploy --prebuilt --archive=tgz
```

This example uses the `vercel build` command to build your project locally. It then uses the `--prebuilt` and `--archive=tgz` options on the `deploy` command to compress the build output and then deploy it.

### [Build env](https://vercel.com/docs/cli/deploy\#build-env)

The `--build-env` option, shorthand `-b`, can be used to provide environment variables to the [build step](https://vercel.com/docs/deployments/configure-a-build).

terminal

```code-block_code__isn_V
vercel --build-env KEY1=value1 --build-env KEY2=value2
```

Using the `vercel` command with the
`--build-env` option.

### [Yes](https://vercel.com/docs/cli/deploy\#yes)

The `--yes` option can be used to skip questions you are asked when setting up a new Vercel project.
The questions will be answered with the provided defaults, inferred from `vercel.json` and the folder name.

terminal

```code-block_code__isn_V
vercel --yes
```

Using the `vercel` command with the
`--yes` option.

### [Env](https://vercel.com/docs/cli/deploy\#env)

The `--env` option, shorthand `-e`, can be used to provide [environment variables](https://vercel.com/docs/environment-variables) at runtime.

terminal

```code-block_code__isn_V
vercel --env KEY1=value1 --env KEY2=value2
```

Using the `vercel` command with the
`--env` option.

### [Name](https://vercel.com/docs/cli/deploy\#name)

The `--name` option has been deprecated in favor of
[Vercel project linking](./vercel-cli-project-linking.md), which allows you to link
a Vercel project to your local codebase when you run
`vercel`.

The `--name` option, shorthand `-n`, can be used to provide a Vercel project name for a deployment.

terminal

```code-block_code__isn_V
vercel --name foo
```

Using the `vercel` command with the
`--name` option.

### [Prod](https://vercel.com/docs/cli/deploy\#prod)

The `--prod` option can be used to create a deployment for a production domain specified in the Vercel project dashboard.

terminal

```code-block_code__isn_V
vercel --prod
```

Using the `vercel` command with the
`--prod` option.

### [Skip Domain](https://vercel.com/docs/cli/deploy\#skip-domain)

This CLI option will override the [Auto-assign Custom Production\\
Domains](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment)
project setting.

Must be used with [`--prod`](./vercel-cli-deploy.md#prod). The `--skip-domain` option will disable the automatic promotion (aliasing) of the relevant domains to a new production deployment. You can use [`vercel promote`](./vercel-cli-promote.md) to complete the domain-assignment process later.

terminal

```code-block_code__isn_V
vercel --prod --skip-domain
```

Using the `vercel` command with the
`--skip-domain` option.

### [Public](https://vercel.com/docs/cli/deploy\#public)

The `--public` option can be used to ensures the source code is publicly available at the `/_src` path.

terminal

```code-block_code__isn_V
vercel --public
```

Using the `vercel` command with the
`--public` option.

### [Regions](https://vercel.com/docs/cli/deploy\#regions)

The `--regions` option can be used to specify which [regions](https://vercel.com/docs/regions) the deployments [Vercel functions](https://vercel.com/docs/functions) should run in.

terminal

```code-block_code__isn_V
vercel --regions sfo1
```

Using the `vercel` command with the
`--regions` option.

### [No wait](https://vercel.com/docs/cli/deploy\#no-wait)

The `--no-wait` option does not wait for a deployment to finish before exiting from the `deploy` command.

terminal

```code-block_code__isn_V
vercel --no-wait
```

### [Force](https://vercel.com/docs/cli/deploy\#force)

The `--force` option, shorthand `-f`, is used to force a new deployment without the [build cache](https://vercel.com/docs/deployments/troubleshoot-a-build#what-is-cached).

terminal

```code-block_code__isn_V
vercel --force
```

### [With cache](https://vercel.com/docs/cli/deploy\#with-cache)

The `--with-cache` option is used to retain the [build cache](https://vercel.com/docs/deployments/troubleshoot-a-build#what-is-cached) when using `--force`.

terminal

```code-block_code__isn_V
vercel --force --with-cache
```

### [Archive](https://vercel.com/docs/cli/deploy\#archive)

The `--archive` option compresses the deployment code into one or more files before uploading it. This option should be used when deployments include thousands of files to avoid rate limits such as the [files limit](https://vercel.com/docs/limits#files).

In some cases, `--archive` makes deployments slower. This happens because the caching of source files to optimize file uploads in future deployments is negated when source files are archived.

terminal

```code-block_code__isn_V
vercel deploy --archive=tgz
```

### [Logs](https://vercel.com/docs/cli/deploy\#logs)

The `--logs` option, shorthand `-l`, also prints the build logs.

terminal

```code-block_code__isn_V
vercel deploy --logs
```

Using the `vercel deploy` command with the
`--logs` option, to view logs from the build process.

### [Meta](https://vercel.com/docs/cli/deploy\#meta)

The `--meta` option, shorthand `-m`, is used to add metadata to the deployment.

terminal

```code-block_code__isn_V
vercel deploy --meta KEY1=value1
```

Deployments can be filtered using this data with [`vercel list   --meta`](./vercel-cli-list.md#meta).

### [target](https://vercel.com/docs/cli/deploy\#target)

Use the `--target` option to define the environment you want to deploy to. This could be production, preview, or a [custom environment](https://vercel.com/docs/deployments/environments#custom-environments).

terminal

```code-block_code__isn_V
vercel deploy --target=staging
```

## [Global Options](https://vercel.com/docs/cli/deploy\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel deploy` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
