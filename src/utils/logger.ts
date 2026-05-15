type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const formatArgs = (scope: string, level: LogLevel, args: unknown[]) => [
  `[${scope}]`,
  level.toUpperCase(),
  ...args,
];

const write = (level: LogLevel, scope: string, ...args: unknown[]) => {
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