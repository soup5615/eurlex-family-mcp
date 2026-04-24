#!/usr/bin/env node
import { startServer } from "./server.js";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const port = parseInt(
  arg("port", process.env.PORT ?? "4050") ?? "4050",
  10,
);
const host = arg("host", process.env.HOST ?? "127.0.0.1");
const dataPath = arg("data", process.env.DATA_PATH ?? "./data/cases.json");

const { url } = startServer({
  port,
  ...(host !== undefined ? { host } : {}),
  ...(dataPath !== undefined ? { dataPath } : {}),
});

process.stdout.write(
  `eurlex-family-web démarré sur ${url} (données : ${dataPath})\n`,
);
