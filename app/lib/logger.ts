const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogFunction = (message: string, ...args: any[]) => void;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  args?: any[];
}

const formatLogEntry = (level: LogLevel, message: string, args: any[]): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  args: args.length > 0 ? args : undefined,
});

const logToConsole = (entry: LogEntry): void => {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const logFn = console[entry.level];

  if (entry.args) {
    logFn(prefix, entry.message, ...entry.args);
  } else {
    logFn(prefix, entry.message);
  }
};

const createLogger = (level: LogLevel): LogFunction => {
  return (message: string, ...args: any[]) => {
    if (!isDevelopment && level !== 'error') return;

    try {
      const entry = formatLogEntry(level, message, args);
      logToConsole(entry);
    } catch (error) {
      console.error('[Logger Error]', error);
    }
  };
};

export const logger = {
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug'),
}; 