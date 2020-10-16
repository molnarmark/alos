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
    const body = this.parseExpr();
    this.expect('PUNC', ';');

    return { type: 'VarDef', name, value: body };
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
      case 'STRING':
        return { type: 'String', value: this.advance().value };

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
    throw new Error(
      `Unexpected token at ${this.current.line}:${this.current.col} => '${this.current.value}', expected '${tokenValue}'`
    );
  }
}

module.exports = Parser;
