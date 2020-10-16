const readFileSync = require('fs').readFileSync;
const chalk = require('chalk');

let testFile = readFileSync(`./examples/goal1.alos`).toString();

testFile = testFile
  .replace(/\/\/.*?\n/g, '')
  .replace(/^\s*\n/gm, '')
  .split('\n');

console.log(chalk.gray(25testFile[24]));
console.log(chalk.red('Unexpected token at line 25 col 425, got , expected '));
