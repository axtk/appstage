#!/usr/bin/env node
import { cli } from "../cli.ts";

// Runs the build script with custom arguments.
await cli(process.argv.slice(2));
