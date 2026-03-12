#!/usr/bin/env node
import { start } from "../start.ts";

// Runs the build script with a development preset.
await start("development", process.argv[2]);
