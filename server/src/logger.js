import winston from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const isProd = process.env.NODE_ENV === 'production';

// Production: structured JSON (Render's log viewer indexes these).
// Dev: human-readable single line, but metadata still preserved.
const devFormat = printf(({ timestamp: ts, level, message, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const body = stack || message;
  return `${ts} ${level} ${body}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  levels,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    isProd ? json() : combine(colorize({ level: true }), devFormat),
  ),
  transports: [new winston.transports.Console()],
});

// Express middleware: log every request once it completes.
// Captures method, path, status, duration, and (if attached by auth
// middleware) req.user.id. Skips body/headers to avoid leaking secrets.
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.http('request', {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration_ms: Math.round(durationMs),
      user_id: req.user?.id,
    });
  });
  next();
}

// Express error handler — must be registered last.
export function errorLogger(err, req, res, _next) {
  logger.error(err.message, {
    stack: err.stack,
    method: req.method,
    path: req.originalUrl || req.url,
    user_id: req.user?.id,
  });
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: 'Internal server error' });
}

export default logger;
