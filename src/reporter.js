const chalk = require('chalk');

module.exports.error = function (msg) {
  console.log(chalk.bgRedBright.white(`ERROR: ${msg}`));
  process.exit(0);
};

module.exports.debug = function (msg) {
  console.log(chalk.gray(`[alos debug]: ${msg}`));
};
