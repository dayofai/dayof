# vercel rolling-release

The `vercel rolling-release` command (also available as `vercel rr`) is used to manage your project's rolling releases. [Rolling releases](https://vercel.com/docs/rolling-releases) allow you to gradually roll out new deployments to a small fraction of your users before promoting them to everyone.

## [Usage](https://vercel.com/docs/cli/rolling-release\#usage)

terminal

```code-block_code__isn_V
vercel rolling-release [command]
```

Using `vercel rolling-release` with a specific command
to manage rolling releases.

## [Commands](https://vercel.com/docs/cli/rolling-release\#commands)

### [configure](https://vercel.com/docs/cli/rolling-release\#configure)

Configure rolling release settings for a project.

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='{"enabled":true, "advancementType":"manual-approval", "stages":[{"targetPercentage":10},{"targetPercentage":50},{"targetPercentage":100}]}'
```

Using the `vercel rolling-release configure` command to
set up a rolling release with manual approval stages.

### [start](https://vercel.com/docs/cli/rolling-release\#start)

Start a rolling release for a specific deployment.

terminal

```code-block_code__isn_V
vercel rolling-release start --dpl=dpl_abc //Where "dpl_abc" is the deployment id or URL
```

Using the `vercel rolling-release start` command to
begin a rolling release for a deployment.

### [approve](https://vercel.com/docs/cli/rolling-release\#approve)

Approve the current stage of an active rolling release.

terminal

```code-block_code__isn_V
vercel rolling-release approve --dpl=dpl_abc --currentStageIndex=0
```

Using the `vercel rolling-release approve` command to
approve the current stage and advance to the next stage.

### [abort](https://vercel.com/docs/cli/rolling-release\#abort)

Abort an active rolling release.

terminal

```code-block_code__isn_V
vercel rolling-release abort --dpl=dpl_abc
```

Using the `vercel rolling-release abort` command to
stop an active rolling release.

### [complete](https://vercel.com/docs/cli/rolling-release\#complete)

Complete an active rolling release, promoting the deployment to 100% of traffic.

terminal

```code-block_code__isn_V
vercel rolling-release complete --dpl=dpl_abc
```

Using the `vercel rolling-release complete` command to
finish a rolling release and fully promote the deployment.

### [fetch](https://vercel.com/docs/cli/rolling-release\#fetch)

Fetch details about a rolling release.

terminal

```code-block_code__isn_V
vercel rolling-release fetch
```

Using the `vercel rolling-release fetch` command to get
information about the current rolling release.

## [Unique Options](https://vercel.com/docs/cli/rolling-release\#unique-options)

These are options that only apply to the `vercel rolling-release` command.

### [Configuration](https://vercel.com/docs/cli/rolling-release\#configuration)

The `--cfg` option is used to configure rolling release settings. It accepts a JSON string or the value `'disable'` to turn off rolling releases.

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='{"enabled":true, "advancementType":"automatic", "stages":[{"targetPercentage":10,"duration":5},{"targetPercentage":100}]}'
```

Using the `vercel rolling-release configure` command
with automatic advancement.

### [Deployment](https://vercel.com/docs/cli/rolling-release\#deployment)

The `--dpl` option specifies the deployment ID or URL for rolling release operations.

terminal

```code-block_code__isn_V
vercel rolling-release start --dpl=https://example.vercel.app
```

Using the `vercel rolling-release start` command with a
deployment URL.

### [Current Stage Index](https://vercel.com/docs/cli/rolling-release\#current-stage-index)

The `--currentStageIndex` option specifies the current stage index when approving a rolling release stage.

terminal

```code-block_code__isn_V
vercel rolling-release approve --currentStageIndex=0 --dpl=dpl_123
```

Using the `vercel rolling-release approve` command with
a specific stage index.

## [Examples](https://vercel.com/docs/cli/rolling-release\#examples)

### [Configure a rolling release with automatic advancement](https://vercel.com/docs/cli/rolling-release\#configure-a-rolling-release-with-automatic-advancement)

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='{"enabled":true, "advancementType":"automatic", "stages":[{"targetPercentage":10,"duration":5},{"targetPercentage":100}]}'
```

This configures a rolling release that starts at 10% traffic, automatically advances after 5 minutes, and then goes to 100%.

### [Configure a rolling release with manual approval](https://vercel.com/docs/cli/rolling-release\#configure-a-rolling-release-with-manual-approval)

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='{"enabled":true, "advancementType":"manual-approval","stages":[{"targetPercentage":10},{"targetPercentage":100}]}'
```

This configures a rolling release that starts at 10% traffic and requires manual approval to advance to 100%.

### [Configure a multi-stage rolling release](https://vercel.com/docs/cli/rolling-release\#configure-a-multi-stage-rolling-release)

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='{"enabled":true, "advancementType":"manual-approval", "stages":[{"targetPercentage":10},{"targetPercentage":50},{"targetPercentage":100}]}'
```

This configures a rolling release with three stages: 10%, 50%, and 100% traffic, each requiring manual approval.

### [Disable rolling releases](https://vercel.com/docs/cli/rolling-release\#disable-rolling-releases)

terminal

```code-block_code__isn_V
vercel rolling-release configure --cfg='disable'
```

This disables rolling releases for the project.

## [Global Options](https://vercel.com/docs/cli/rolling-release\#global-options)

The following [global options](./vercel-cli-global-options.md) can be passed when using the `vercel rolling-release` command:

- [`--cwd`](./vercel-cli-global-options.md#current-working-directory)
- [`--debug`](./vercel-cli-global-options.md#debug)
- [`--global-config`](./vercel-cli-global-options.md#global-config)
- [`--help`](./vercel-cli-global-options.md#help)
- [`--local-config`](./vercel-cli-global-options.md#local-config)
- [`--no-color`](./vercel-cli-global-options.md#no-color)
- [`--scope`](./vercel-cli-global-options.md#scope)
- [`--token`](./vercel-cli-global-options.md#token)

For more information on global options and their usage, refer to the [options section](./vercel-cli-global-options.md).
