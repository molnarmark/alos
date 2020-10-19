const ipfix = require('ipfix');
const { error } = require('../reporter');

const AST = require('./ast');
const ASTNode = require('./node');

const OPERATORS = ['+', '-', '/', '%'];

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.current = this.tokens[this.pos];
    this.previous = null;
  }

  parse() {
    const topLevelNode = new AST('TopLevel');
    const firstStatement = this.parseStatement();
    topLevelNode.nodes.push(firstStatement);

    // Lets parse statements
    while (this.current.type !== 'EOF') {
      const astNode = this.parseStatement();
      topLevelNode.nodes.push(astNode);
    }

    return topLevelNode;
  }

  parseStatements() {
    const statements = [];
    while (this.current.value !== '}') {
      const statement = this.parseStatement();
      statements.push(statement);
    }

    return statements;
  }

  parseStatement() {
    switch (this.current.type) {
      case 'EOF':
        return new ASTNode('NoOp');

      case 'ID': {
        // module definition
        if (this.current.value === 'module') {
          return this.parseModuleDef();
        }

        // use statement
        if (this.current.value === 'use') {
          return this.parseUseStatement();
        }

        // variable definition
        if (this.current.value === 'let') {
          return this.parseVariableDef();
        }

        // fixed variable definition
        if (this.current.value === 'fixed') {
          return this.parseFixedVariableDef();
        }

        // function call
        if (this.peek().value === '(') {
          return this.parseFunctionCall();
        }

        // function definition
        if (this.current.value === 'sub') {
          return this.parseFunctionDef();
        }

        // return statement
        if (this.current.value === 'return') {
          return this.parseReturn();
        }

        if (this.peek().value === '=') {
          return this.parseVariableAssignment();
        }
      }
      case 'PUNC': {
        // blocks
        if (this.current.value === '{') {
          return this.parseBlock();
        }

        // builtin call
        if (this.current.value === '@') {
          return this.parseBuiltinFunctionCall();
        }
      }
    }
  }
  parseModuleDef() {
    this.expect('ID', 'module');
    const path = this.expect('ID').value;
    this.expect('PUNC', ';');

    return new ASTNode('ModuleDef', path);
  }

  parseUseStatement() {
    this.expect('ID', 'use');
    const path = this.expect('STRING').value;
    this.expect('PUNC', ';');

    return new ASTNode('UseStmt', path);
  }

  parseReturn() {
    this.expect('ID', 'return');
    const expr = this.parseExpr();
    this.expect('PUNC', ';');

    return new ASTNode('ReturnStmt', expr);
  }

  parseVariableDef() {
    this.expect('ID', 'let');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();
    this.expect('PUNC', ';');

    return new ASTNode('VarDef', body, name);
  }

  parseVariableAssignment() {
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();
    this.expect('PUNC', ';');

    return new ASTNode('VarAssignment', body, name);
  }

  parseFixedVariableDef() {
    this.expect('ID', 'fixed');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();
    this.expect('PUNC', ';');

    return new ASTNode('FixedVarDef', body, name);
  }

  parseFunctionCall(asExpr = false) {
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    let params = [];

    while (this.current.value !== ')') {
      const expr = this.parseExpr();
      if (expr) {
        params.push(expr);
      }
    }

    this.expect('PUNC', ')');
    if (!asExpr) {
      this.expect('PUNC', ';');
    }

    const argList = new ASTNode('ArgList', params);
    return new ASTNode('FuncCall', argList, name);
  }

  parseBuiltinFunctionCall(asExpr = false) {
    this.expect('PUNC', '@');
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    let params = [];

    while (this.current.value !== ')') {
      const expr = this.parseExpr();
      if (expr) {
        params.push(expr);
      }
    }

    this.expect('PUNC', ')');
    if (!asExpr) {
      this.expect('PUNC', ';');
    }

    const argList = new ASTNode('ArgList', params);
    return new ASTNode('BuiltinFuncCall', argList, name);
  }

  parseFunctionDef() {
    this.expect('ID', 'sub');
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    let args = [];

    while (this.current.value !== ')') {
      const expr = this.parseExpr();
      if (expr) {
        args.push(expr);
      }
    }

    // TODO make use of parseBlock here
    this.expect('PUNC', ')');
    this.expect('PUNC', '->');
    const isArrow = this.expect('PUNC', '{', true) ? false : true;
    let body = isArrow ? this.parseExpr() : this.parseStatements();
    this.expect('PUNC', '}', true);
    if (isArrow) {
      this.expect('PUNC', ';');
      body = [{ type: 'ReturnStmt', value: body }];
    }

    return new ASTNode('FuncDef', body, name, args);
  }

  parseBlock() {
    this.expect('PUNC', '{');
    const body = this.parseStatements();
    this.expect('PUNC', '}');

    return new ASTNode('Block', body);
  }

  parseExpr() {
    switch (this.current.type) {
      case 'PUNC':
        if (this.current.value === '(') return this.parseGroupedExpr();
        this.advance();
        break;

      case 'STRING':
        return new ASTNode('String', this.advance().value);

      case 'NUMBER':
        return new ASTNode('Number', parseFloat(this.advance().value));

      case 'OP':
        return new ASTNode('Op', this.advance().value);

      case 'ID':
        // variable definitions for example can contain a function call
        if (this.peek().value === '(') {
          return this.parseFunctionCall(true);
        } else {
          return new ASTNode('Variable', this.advance().value);
        }
    }
  }

  parseGroupedExpr() {
    this.expect('PUNC', '(');
    const exprs = [];
    while (this.current.value !== ')') {
      exprs.push(this.parseExpr());
    }
    this.expect('PUNC', ')');

    return new ASTNode('GroupedExpr', exprs);
  }

  getBody() {
    let body = [this.parseExpr()]; // parsing left by default
    while (true) {
      // TODO fix this if statement later
      if (
        this.isOperator(this.current.value) ||
        (this.isExpr(this.current.type) && !this.isPunc(this.current.value))
      ) {
        const expr = this.parseExpr();
        body.push(expr);
      } else {
        break;
      }
    }
    // handling binary ops
    if (body.find(x => x.type === 'Op')) {
      body = new ASTNode('BinaryExpr', ipfix.transform(body.map(x => x.value).join('')));
    }

    if (body.length === 1) {
      body = body[0];
    }

    return body;
  }

  isOperator(char) {
    return OPERATORS.includes(char);
  }

  isExpr(char) {
    return ['PUNC', 'STRING', 'NUMBER', 'OP', 'ID'].includes(char);
  }

  isPunc(char) {
    return ['(', ')', '<', '>', '{', '}', ';', ',', '@', '='].includes(char);
  }

  expect(tokenType, tokenValue, optional = false) {
    if (tokenValue) {
      return this.expect_with(tokenType, tokenValue, optional);
    }

    if (this.current.type === tokenType) {
      return this.advance();
    } else {
      return optional ? false : this.unexpectedError(tokenType);
    }
  }

  expect_with(tokenType, tokenValue, optional = false) {
    if (this.current.type === tokenType && this.current.value === tokenValue) {
      return this.advance();
    } else {
      return optional ? false : this.unexpectedError(tokenValue);
    }
  }

  advance() {
    const current = this.current;
    this.pos++;
    this.current = this.tokens[this.pos];
    this.previous = this.tokens[this.pos - 1];
    // console.log(`Eating ${current.value}`);
    return current;
  }

  peek() {
    return this.tokens[this.pos + 1];
  }

  unexpectedError(tokenValue) {
    error(
      `Unexpected token at line ${this.current.line} col ${this.current.col}, got '${this.current.value}', expected '${tokenValue}'`
    );
  }
}

module.exports = Parser;
