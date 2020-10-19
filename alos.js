#!/usr/bin/env node

const chalk = require("chalk");
const args = require("minimist")(process.argv.slice(2));
const path = require("path");

const run = require("./src/run");

// prettier-ignore
const help = `
${chalk.blueBright.underline(`The Alos Programming Language`)}

Available commands:
    ${chalk.blue("run <path to alos file>")}    Executes an Alos program
    ${chalk.blue("ast <path to alos file>")}    Returns a JSON tree of the AST the parser produces
    ${chalk.blue("help")}                       Shows this message
`;

const showHelp = () => console.log(help);

(() => {
  const { _ } = args;
  if (_.length === 0) {
    return showHelp();
  }

  switch (_[0]) {
    case "run":
      return run(path.resolve(process.cwd(), _[1]));
  }
})();
