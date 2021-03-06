const readFileSync = require('fs').readFileSync;
const Lexer = require('./lexer/lexer');
const Parser = require('./parser/parser');
const Evaluator = require('./eval/evaluator');
const util = require('util');
const path = require('path');

function run(filePath) {
  let testFile = readFileSync(filePath).toString();

  // Removing comments from file
  // In no way is this optional
  for (let line of testFile.split('\n')) {
    line = line.trim();
    if (line.startsWith('#')) {
      testFile = testFile.replace(line, '');
    }
    // Use statements
    if (line.startsWith('use')) {
      const useLine = line.replace(';', '').split(' ');
      const filePath = useLine.pop().replace(/"/g, '');
      const contents = readFileSync(path.resolve(process.cwd(), `${filePath}.alos`)).toString();
      testFile = testFile.replace(line, contents);
    }
  }

  const lexer = new Lexer(testFile);
  const tokens = lexer.lex();
  // console.log(tokens);
  // process.exit(0);
  const parser = new Parser(tokens);
  const ast = parser.parse();

  console.log(util.inspect(ast, { colors: true, depth: 999 }));
  console.log('\n------------------\n');

  const eval = new Evaluator();
  return eval.visitTopLevel(ast);
}

module.exports = run;
