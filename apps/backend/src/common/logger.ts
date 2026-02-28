import pino from 'pino';
import pretty from 'pino-pretty';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './env';

const level = isDev ? 'debug' : 'info';

const logger = isDev
  ? pino(
      { level },
      pino.multistream([
        { stream: pretty({ colorize: true }) },
        {
          stream: pino.destination({
            dest: resolve(dirname(fileURLToPath(import.meta.url)), '../../logs/dev.log'),
            append: true,
            mkdir: true,
          }),
        },
      ])
    )
  : pino({ level });

export { logger };
export default logger;
