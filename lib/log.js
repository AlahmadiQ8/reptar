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

  createActivity(name) {
    return activity.create(name);
  },

  startActivity(name) {
    return activity.start(name);
  },

  markActivity(id) {
    return activity.mark(id);
  },

  destroyActivity(id) {
    return activity.destroy(id);
  },

  endActivity(id) {
    return activity.end(id);
  },
};