#!/usr/bin/env bash
# lib/run.sh <original command...>
#
# Runs the dyno command with stdout transformed by wrap-logs.js.

set -euo pipefail

exec /usr/bin/env node /app/.heroku-runtime-metrics/wrap-logs.js "$@"
