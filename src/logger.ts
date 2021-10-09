import { default as logger, format } from 'winston'

// configures logging output to console
const consoleOutput = new logger.transports.Console({
  format: format.combine(format.colorize(), format.simple()),
})

logger.add(consoleOutput)
// logger.add(new logger.transports.File({ filename: 'combined.log' }))

export default logger
