import pino from "pino";

let logLevel: string = "info";

export function setLogLevel(level: string): void {
  logLevel = level;
}

/**
 * Creates a child logger with the given module name.
 * Logs to stderr to avoid interfering with MCP stdio transport.
 */
export function createLogger(module: string): pino.Logger {
  return pino(
    {
      name: module,
      level: logLevel,
      transport: {
        target: "pino/file",
        options: { destination: 2 }, // stderr
      },
    }
  );
}
