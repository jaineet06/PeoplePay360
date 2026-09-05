import env from '../configs/env.js';

function log(level, message, meta) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...(meta && { meta }) };
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify(entry));
}

export default {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => { if (env.isDev) log('debug', msg, meta); },
};
