const chalk = require('chalk');

module.exports.error = function (msg) {
  console.log(chalk.red(msg));
  process.exit(0);
};
