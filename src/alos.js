const readFileSync = require('fs').readFileSync;
const Lexer = require('./lexer/lexer');
const Parser = require('./parser/parser');
const Evaluator = require('./eval/evaluator');
const util = require('util');

function main() {
  let testFile = readFileSync(`./examples/${process.argv[2]}`).toString();

  // Removing comments from file
  // In no way is this optional
  for (let line of testFile.split('\n')) {
    if (line.startsWith('#')) {
      testFile = testFile.replace(line, '');
    }
  }
  const lexer = new Lexer(testFile);
  const tokens = lexer.lex();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  console.log(util.inspect(ast, { colors: true, depth: 999 }));
  console.log('\n------------------\n');

  const eval = new Evaluator();
  eval.visitTopLevel(ast);
}

main();
