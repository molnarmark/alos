const ipfix = require('ipfix');
const { error } = require('./reporter');

const KEYWORDS = ['let', 'fixed'];
const OPERATORS = ['+', '-', '/', '%'];

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.current = this.tokens[this.pos];
    this.previous = null;
  }

  parse() {
    const topLevelNode = { type: 'TopLevel', children: [] };
    const firstStatement = this.parseStatement();
    topLevelNode.children.push(firstStatement);

    // Lets parse statements
    while (this.current.type !== 'EOF') {
      const astNode = this.parseStatement();
      topLevelNode.children.push(astNode);
    }

    return topLevelNode;
  }

  parseStatements() {
    const statements = [];
    while (this.current.type !== 'PUNC' && this.current.value !== '}') {
      const statement = this.parseStatement();
      statements.push(statement);
    }

    return statements;
  }

  parseStatement() {
    switch (this.current.type) {
      case 'EOF':
        return { type: 'NoOp', value: null };

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

    return { type: 'ModuleDef', value: path };
  }

  parseUseStatement() {
    this.expect('ID', 'use');
    const path = this.expect('STRING').value;
    this.expect('PUNC', ';');

    return { type: 'UseStmt', value: path };
  }

  parseReturn() {
    this.expect('ID', 'return');
    const expr = this.parseExpr();
    this.expect('PUNC', ';');

    return { type: 'ReturnStmt', value: expr };
  }

  parseVariableDef() {
    this.expect('ID', 'let');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();

    this.expect('PUNC', ';');

    return { type: 'VarDef', name, value: body };
  }

  parseVariableAssignment() {
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();

    this.expect('PUNC', ';');

    return { type: 'VarAssignment', name, value: body };
  }

  parseFixedVariableDef() {
    this.expect('ID', 'fixed');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.getBody();

    this.expect('PUNC', ';');

    return { type: 'FixedVarDef', name, value: body };
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

    return { type: 'FuncCall', name, value: { type: 'ArgList', value: params } };
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

    return { type: 'BuiltinFuncCall', name, value: { type: 'ArgList', value: params } };
  }

  parseFunctionDef() {
    this.expect('ID', 'fun');
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    // TODO parse function args
    this.expect('PUNC', ')');
    this.expect('PUNC', '=>');
    this.expect('PUNC', '{');
    const body = this.parseStatements();
    this.expect('PUNC', '}');

    return { type: 'FuncDef', name, value: { type: 'Block', value: body } };
  }

  parseBlock() {
    this.expect('PUNC', '{');
    const body = this.parseStatements();
    this.expect('PUNC', '}');

    return { type: 'Block', value: body };
  }

  parseExpr() {
    switch (this.current.type) {
      case 'PUNC':
        if (this.current.value === '(') return this.parseGroupedExpr();
        this.advance();
        break;

      case 'STRING':
        return { type: 'String', value: this.advance().value };

      case 'NUMBER':
        return { type: 'Number', value: parseFloat(this.advance().value) };

      case 'OP':
        return { type: 'Op', value: this.advance().value };

      case 'ID':
        // variable definitions for example can contain a function call
        if (this.peek().value === '(') {
          return this.parseFunctionCall(true);
        } else {
          return { type: 'Variable', value: this.advance().value };
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
    return { type: 'GroupedExpr', value: exprs };
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
    if (body.find((x) => x.type === 'Op')) {
      body = { type: 'BinaryExpr', value: ipfix.transform(body.map((x) => x.value).join('')) };
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

  expect(tokenType, tokenValue) {
    if (tokenValue) {
      return this.expect_with(tokenType, tokenValue);
    }

    if (this.current.type === tokenType) {
      return this.advance();
    } else {
      this.unexpectedError(tokenType);
    }
  }

  expect_with(tokenType, tokenValue) {
    if (this.current.type === tokenType && this.current.value === tokenValue) {
      return this.advance();
    } else {
      this.unexpectedError(tokenValue);
    }
  }

  advance() {
    const current = this.current;
    this.pos++;
    this.current = this.tokens[this.pos];
    this.previous = this.tokens[this.pos - 1];
    console.log(`Eating ${current.value}`);
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
