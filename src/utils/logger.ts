type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const detectDefaultLevel = (): LogLevel => {
  const processNodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  if (processNodeEnv === 'production') {
    return 'info';
  }

  const browserHost = (globalThis as { location?: { hostname?: string } }).location?.hostname;
  if (browserHost && browserHost !== 'localhost' && browserHost !== '127.0.0.1') {
    return 'info';
  }

  return 'debug';
};

const resolveConfiguredLevel = (): LogLevel => {
  const globalLevel = (globalThis as { __APP_LOG_LEVEL__?: unknown }).__APP_LOG_LEVEL__;
  if (typeof globalLevel === 'string') {
    const normalized = globalLevel.toLowerCase();
    if (normalized === 'debug' || normalized === 'info' || normalized === 'warn' || normalized === 'error') {
      return normalized;
    }
  }

  return detectDefaultLevel();
};

const formatArgs = (scope: string, level: LogLevel, args: unknown[]) => [
  `[${scope}]`,
  level.toUpperCase(),
  ...args,
];

const write = (level: LogLevel, scope: string, ...args: unknown[]) => {
  const configuredLevel = resolveConfiguredLevel();
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[configuredLevel]) {
    return;
  }

  const method = console[level] ?? console.log;
  method(...formatArgs(scope, level, args));
};

export const createLogger = (scope: string) => ({
  debug: (...args: unknown[]) => write('debug', scope, ...args),
  info: (...args: unknown[]) => write('info', scope, ...args),
  warn: (...args: unknown[]) => write('warn', scope, ...args),
  error: (...args: unknown[]) => write('error', scope, ...args),
});

export const logger = createLogger('app');