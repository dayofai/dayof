# Telemetry

Participation in this program is optional, and you may
[opt-out](./vercel-cli-about-telemetry.md#how-do-i-opt-out-of-vercel-cli-telemetry) if you would prefer not
to share any telemetry information.

## [Why is telemetry collected?](./vercel-cli-about-telemetry.md#why-is-telemetry-collected)

Vercel CLI Telemetry provides an accurate gauge of Vercel CLI feature usage, pain points, and customization across all users. This data enables tailoring the Vercel CLI to your needs, supports its continued growth relevance, and optimal developer experience, as well as verifies if improvements are enhancing the baseline performance of all applications.

## [What is being collected?](./vercel-cli-about-telemetry.md#what-is-being-collected)

Vercel takes privacy and security seriously. Vercel CLI Telemetry tracks general usage information, such as commands and arguments used.
Specifically, the following are tracked:

- Command invoked ( `vercel build`, `vercel deploy`, `vercel login`, etc.)
- Version of the Vercel CLI
- General machine information (e.g. number of CPUs, macOS/Windows/Linux, whether or not the command was run within CI)

This list is regularly audited to ensure its accuracy.

You can view exactly what is being collected by setting the following environment variable: `VERCEL_TELEMETRY_DEBUG=1`.

When this environment variable is set, data will not be sent to Vercel.
The data will only be printed out to the [_stderr_ stream](https://en.wikipedia.org/wiki/Standard_streams), prefixed with `[telemetry]`.

An example telemetry event looks like this:

```code-block_code__isn_V
{
  "id": "cf9022fd-e4b3-4f67-bda2-f02dba5b2e40",
  "eventTime": 1728421688109,
  "key": "subcommand:ls",
  "value": "ls",
  "teamId": "team_9Cdf9AE0j9ef09FaSdEU0f0s",
  "sessionId": "e29b9b32-3edd-4599-92d2-f6886af005f6"
}
```

## [What about sensitive data?](./vercel-cli-about-telemetry.md#what-about-sensitive-data)

Vercel CLI Telemetry does not collect any metrics which may contain sensitive data, including, but not limited to: environment variables, file paths, contents of files, logs, or serialized JavaScript errors.

For more information about Vercel's privacy practices, please see our [Privacy Notice](https://vercel.com/legal/privacy-policy) and if you have any questions, feel free to reach out to [privacy@vercel.com](mailto:privacy@vercel.com).

## [How do I opt-out of Vercel CLI telemetry?](./vercel-cli-about-telemetry.md#how-do-i-opt-out-of-vercel-cli-telemetry)

You may use the [vercel telemetry](./vercel-cli-telemetry.md) command to manage the telemetry collection status. This sets a global configuration value on your computer.

You may opt-out of telemetry data collection by running `vercel telemetry disable`:

terminal

```code-block_code__isn_V
vercel telemetry disable
```

You may check the status of telemetry collection at any time by running `vercel telemetry status`:

terminal

```code-block_code__isn_V
vercel telemetry status
```

You may re-enable telemetry if you'd like to re-join the program by running the following:

terminal

```code-block_code__isn_V
vercel telemetry enable
```

Alternatively, you may opt-out by setting an environment variable: `VERCEL_TELEMETRY_DISABLED=1`. This will only apply for runs where the environment variable is set and will not change your configured telemetry status.

---