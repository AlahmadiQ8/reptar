import chalk from 'chalk';
import activity from 'activity-logger';

export default {
  info(...args) {
    const prefix = chalk.green('info') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  warn(...args) {
    const prefix = chalk.yellow('warn') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  error(...args) {
    const prefix = chalk.red('error') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  startActivity(name) {
    return activity.start(name);
  },

  endActivity(id) {
    return activity.end(id);
  },
};