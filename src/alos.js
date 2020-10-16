const readFileSync = require('fs').readFileSync;
const Lexer = require('./lexer');
const Parser = require('./parser');
const util = require('util');

function main() {
  let testFile = readFileSync('./examples/goal4.alos').toString();

  // Removing comments from file
  testFile = testFile.replace(/\/\/.*?\n/g, '');

  const lexer = new Lexer(testFile);
  const tokens = lexer.lex();

  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(util.inspect(ast, { colors: true, depth: 999 }));
}

main();
