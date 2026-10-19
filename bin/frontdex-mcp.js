#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadConfig } from 'react-catalogue';
import { startMcpServer } from '../src/server.js';

const { values } = parseArgs({ options: { cwd: { type: 'string', short: 'C' } }, strict: false });
startMcpServer(loadConfig(path.resolve(values.cwd ?? process.cwd())));
