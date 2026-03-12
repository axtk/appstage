#!/usr/bin/env node
import { start } from "../start.ts";

// Runs the build script with a production preset.
await start("production", process.argv[2]);
