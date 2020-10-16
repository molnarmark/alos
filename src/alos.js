const readFileSync = require('fs').readFileSync;
const Lexer = require('./lexer');
const Parser = require('./parser');
const Visitor = require('./visitor');
const util = require('util');

function main() {
  let testFile = readFileSync(`./examples/${process.argv[2]}`).toString();

  // Removing comments from file
  testFile = testFile.replace(/\/\/.*?\n/g, '');

  const lexer = new Lexer(testFile);
  const tokens = lexer.lex();

  const parser = new Parser(tokens);
  const ast = parser.parse();
  // console.log(util.inspect(ast, { colors: true, depth: 999 }));
  // console.log('\n------------------\n');
  const visitor = new Visitor();
  visitor.visit(ast);
}

main();
