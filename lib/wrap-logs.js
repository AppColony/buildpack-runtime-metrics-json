#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const readline = require('readline');

const DYNOS = /^(web|sidekiq|sidekiq_integrations|rpush)\.\d+$/;
const LINE = /^(\S+)\s+heroku\[([^\]]+)\]:\s+(.*)$/;
const SAMPLE = /sample#([a-zA-Z0-9_]+)=([0-9]+(?:\.[0-9]+)?)(MB|kB|GB|pages)?/g;

const argv = process.argv.slice(2);
if (argv.length === 0) {
  process.stderr.write('wrap-logs: missing command (expected: wrap-logs <cmd> [args...])\n');
  process.exit(2);
}

// Procfile commands arrive as one quoted argument, including any env prefix.
const child = spawn(argv.join(' '), [], {
  stdio: ['ignore', 'pipe', 'inherit'],
  shell: true,
});

const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.length === 0) {
    process.stdout.write('\n');
    return;
  }

  const parsedLine = line.match(LINE);
  if (!parsedLine) {
    process.stdout.write(`${line}\n`);
    return;
  }

  const [, timestamp, dynoTag, body] = parsedLine;
  if (!DYNOS.test(dynoTag) || !body.includes('sample#')) {
    process.stdout.write(`${line}\n`);
    return;
  }

  const metrics = {};
  SAMPLE.lastIndex = 0;
  let match;
  while ((match = SAMPLE.exec(body)) !== null) {
    const [, key, value, unit] = match;
    const number = parseFloat(value);
    let outputKey;
    let outputValue;

    if (unit === 'MB') {
      outputKey = `${key}_mb`;
      outputValue = Math.round(number);
    } else if (unit === 'kB') {
      outputKey = `${key}_kb`;
      outputValue = Math.round(number);
    } else if (unit === 'GB') {
      outputKey = `${key}_gb`;
      outputValue = Math.round(number);
    } else if (unit === 'pages') {
      outputKey = key;
      outputValue = Math.round(number);
    } else {
      outputKey = key;
      outputValue = number;
    }

    metrics[outputKey] = outputValue;
  }

  process.stdout.write(`${JSON.stringify({
    timestamp,
    source: dynoTag,
    dyno_source: dynoTag,
    logtype: 'heroku.runtime_metrics',
    ...metrics,
  })}\n`);
});

child.on('error', (error) => {
  process.stderr.write(`wrap-logs: failed to spawn ${argv[0]}: ${error.message}\n`);
  process.exit(127);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
