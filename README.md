# heroku-buildpack-runtime-metrics-json

A Heroku Classic Buildpack that rewrites `log-runtime-metrics` dyno lines as
JSON on the dyno stdout stream. New Relic indexes JSON top-level keys as
queryable attributes, avoiding its unsupported `heroku[<dyno>]` logplex prefix.

## What it rewrites

Given a dyno runtime-metrics line such as:

```text
2026-09-30T11:26:54.092734+00:00 heroku[web.1]: source=web.1 dyno=heroku.x sample#load_avg_1m=0.42 sample#load_avg_5m=0.18 sample#load_avg_15m=0.09
```

the buildpack emits:

```json
{"timestamp":"2026-09-30T11:26:54.092734+00:00","source":"web.1","dyno_source":"web.1","logtype":"heroku.runtime_metrics","load_avg_1m":0.42,"load_avg_5m":0.18,"load_avg_15m":0.09}
```

Memory values in `MB` are rounded and emitted with a `_mb` suffix. `pages`
values are integers, while load averages remain floats. Lines that do not match
the supported runtime-metrics shape pass through unchanged.

Supported dyno types are `web`, `sidekiq`, `sidekiq_integrations`, and `rpush`.

## Installation

Add the pinned archive URL before the language buildpacks:

```text
https://github.com/AppColony/buildpack-runtime-metrics-json/tarball/v0.1.1
```

For example, in Terraform:

```hcl
buildpacks = [
  "https://github.com/AppColony/buildpack-runtime-metrics-json/tarball/v0.1.1",
  "heroku/metrics",
  "heroku/nodejs",
  "heroku/ruby",
]
```

The buildpack runs only on a slug compilation. Changing the configured
buildpack list alone does not rewrite the currently running slug.

## Requirements

- The app has the Heroku `log-runtime-metrics` lab feature enabled.
- The final slug provides `bash` and `node`; the standard Heroku Node buildpack
  provides Node.
- A New Relic HTTPS log drain receives the app's stdout if the resulting JSON
  is intended for New Relic queries.

## Local verification

No dependencies need to be installed. Run:

```bash
bash bin/test
```

The smoke suite verifies the JSON transformation, process exit and stderr
behavior, and the `detect`, `compile`, and `release` buildpack lifecycle
scripts.

## Buildpack layout

Heroku Classic Buildpacks require these scripts at the archive root:

```text
bin/detect
bin/compile
bin/release
```

The release archive has one GitHub-generated top-level directory. Heroku strips
that directory, exposing these paths at the buildpack root.

## License

MIT. See [LICENSE](LICENSE).
