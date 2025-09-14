# Deploying Projects from Vercel CLI

## [Deploying from source](https://vercel.com/docs/cli/deploying-from-cli\#deploying-from-source)

The `vercel` command is used to [deploy](./vercel-cli-deploy.md) Vercel Projects and can be used from either the root of the Vercel Project directory or by providing a path.

terminal

```code-block_code__isn_V
vercel
```

Deploys the current Vercel project, when run from the Vercel Project root.

You can alternatively use the [`vercel deploy` command](./vercel-cli-deploy.md) for the same effect, if you want to be more explicit.

terminal

```code-block_code__isn_V
vercel [path-to-project]
```

Deploys the Vercel project found at the provided path, when it's a Vercel
Project root.

When deploying, stdout is always the Deployment URL.

terminal

```code-block_code__isn_V
vercel > deployment-url.txt
```

Writes the Deployment URL output from the `deploy`
command to a text file.

### [Relevant commands](https://vercel.com/docs/cli/deploying-from-cli\#relevant-commands)

- [deploy](./vercel-cli-deploy.md)

## [Deploying a staged production build](https://vercel.com/docs/cli/deploying-from-cli\#deploying-a-staged-production-build)

By default, when you promote a deployment to production, your domain will point to that deployment. If you want to create a production deployment without assigning it to your domain, for example to avoid sending all of your traffic to it, you can:

1. Turn off the auto-assignment of domains for the current production deployment:

terminal

```code-block_code__isn_V
vercel --prod --skip-domain
```

1. When you are ready, manually promote the staged deployment to production:

terminal

```code-block_code__isn_V
vercel promote [deployment-id or url]
```

### [Relevant commands](https://vercel.com/docs/cli/deploying-from-cli\#relevant-commands)

- [promote](./vercel-cli-promote.md)
- [deploy](./vercel-cli-deploy.md)

## [Deploying from local build (prebuilt)](https://vercel.com/docs/cli/deploying-from-cli\#deploying-from-local-build-prebuilt)

You can build Vercel projects locally to inspect the build outputs before they are [deployed](./vercel-cli-deploy.md). This is a great option for producing builds for Vercel that do not share your source code with the platform.

It's also useful for debugging build outputs.

terminal

```code-block_code__isn_V
vercel build
```

Using the `vercel` command to deploy and write stdout
to a text file.

This produces `.vercel/output` in the [Build Output API](https://vercel.com/docs/build-output-api/v3) format. You can review the output, then [deploy](./vercel-cli-deploy.md) with:

terminal

```code-block_code__isn_V
vercel deploy --prebuilt
```

Deploy the build outputs in `.vercel/output` produced
by `vercel build`.

Review the [When not to use\\
--prebuilt](./vercel-cli-deploy.md#when-not-to-use---prebuilt) section to understand
when you should not use the `--prebuilt` flag.

See more details at [Build Output API](https://vercel.com/docs/build-output-api/v3).

### [Relevant commands](https://vercel.com/docs/cli/deploying-from-cli\#relevant-commands)

- [build](./vercel-cli-build.md)
- [deploy](./vercel-cli-deploy.md)
