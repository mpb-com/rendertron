/** @format */
import ecsFormat from '@elastic/ecs-winston-format';
import winston, { format } from 'winston';

const isEnabled = process.env.ENABLE_ECS_LOGGING === 'true';

const logger = winston.createLogger({
  format: isEnabled ? ecsFormat() : format.simple(),
  transports: [new winston.transports.Console()]
});

export default logger;