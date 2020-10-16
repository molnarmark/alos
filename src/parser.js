const ipfix = require('ipfix');

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.current = this.tokens[this.pos];
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
      case 'ID': {
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
        if (this.current.value === 'fun') {
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
        // load
        if (this.current.value === '@') {
          return this.parseLoad();
        }
      }
    }
  }

  parseLoad() {
    this.expect('PUNC', '@');
    this.expect('ID', 'load');
    const path = this.expect('STRING').value;
    this.expect('PUNC', ';');

    return { type: 'LoadStmt', value: path };
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
    let body = [];
    while (this.current.value !== ';') {
      body.push(this.parseExpr());
    }

    // handling binary ops
    if (body.find((x) => x.type === 'Op')) {
      body = { type: 'BinaryExpr', value: ipfix.transform(body.map((x) => x.value).join('')) };
    }

    if (body.length === 1) {
      body = body[0];
    }

    this.expect('PUNC', ';');

    return { type: 'VarDef', name, value: body };
  }

  parseVariableAssignment() {
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    let body = [];
    while (this.current.value !== ';') {
      body.push(this.parseExpr());
    }

    // handling binary ops
    if (body.find((x) => x.type === 'Op')) {
      body = { type: 'BinaryExpr', value: ipfix.transform(body.map((x) => x.value).join('')) };
    }

    if (body.length === 1) {
      body = body[0];
    }
    this.expect('PUNC', ';');

    return { type: 'VarAssignment', name, value: body };
  }

  parseFixedVariableDef() {
    this.expect('ID', 'fixed');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    let body = [];
    while (this.current.value !== ';') {
      body.push(this.parseExpr());
    }

    // handling binary ops
    if (body.find((x) => x.type === 'Op')) {
      body = { type: 'BinaryExpr', value: ipfix.transform(body.map((x) => x.value).join('')) };
    }

    if (body.length === 1) {
      body = body[0];
    }
    this.expect('PUNC', ';');

    return { type: 'FixedVarDef', name, value: body };
  }

  parseFunctionCall(asExpr = false) {
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    const params = this.parseExpr();
    this.expect('PUNC', ')');
    if (!asExpr) {
      this.expect('PUNC', ';');
    }

    return { type: 'FuncCall', name, value: params };
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

    return { type: 'FuncDef', name, value: body };
  }

  parseExpr() {
    switch (this.current.type) {
      case 'PUNC':
        if (this.current.value === '(') return this.parseGroupedExpr();

      case 'STRING':
        return { type: 'String', value: this.advance().value };

      case 'OP':
        return { type: 'Op', value: this.advance().value };

      case 'NUMBER':
        return { type: 'Number', value: parseFloat(this.advance().value) };

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
    return current;
  }

  peek() {
    return this.tokens[this.pos + 1];
  }

  unexpectedError(tokenValue) {
    console.log(
      `Unexpected token at line ${this.current.line} col ${this.current.col}, got '${this.current.value}', expected '${tokenValue}'`
    );
    process.exit(0);
  }
}

module.exports = Parser;
