import pino from 'pino';
import { isDev } from './env';

const level = isDev ? 'debug' : 'info';
const usePretty = isDev;

const logger = usePretty
  ? pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    })
  : pino({ level });

export { logger };
export default logger;
