# AGENTS.md

## Repository purpose

This repository is a standalone Heroku Classic Buildpack. It rewrites supported
Heroku `log-runtime-metrics` lines on dyno stdout into JSON before they reach a
log drain.

## Required layout

- `bin/detect`, `bin/compile`, and `bin/release` must remain at repository root.
- `bin/compile` receives `<build_dir> <cache_dir> <env_dir>`.
- `bin/compile` installs runtime assets beneath
  `${build_dir}/.heroku-runtime-metrics/` and rewrites the app Procfile.
- Shell entrypoints (`bin/*` and `lib/run.sh`) must remain executable.

## Change requirements

- Run `bash bin/test` after changing any buildpack script or transformer logic.
- Preserve non-matching log lines and child stderr behavior.
- Preserve the wrapped command's exit status.
- Keep the test suite dependency-free: Bash, Node, and standard system tools.
- Do not add credentials, application deployment settings, or environment-specific
  configuration to this repository.

## CI

`.github/workflows/test.yml` validates tests, executable bits, and the archive
layout on pull requests, pushes, tags, and manual dispatches.
