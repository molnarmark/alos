class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.current = this.tokens[this.pos];
  }

  parse() {
    const topLevelNode = { type: 'TopLevel', children: [] };
    const firstStatement = this.parse_statement();
    topLevelNode.children.push(firstStatement);

    // Lets parse statements
    while (this.current.type !== 'EOF') {
      const astNode = this.parse_statement();
      topLevelNode.children.push(astNode);
    }

    return topLevelNode;
  }

  parse_statements() {
    const statements = [];
    while (this.current.type !== 'PUNC' && this.current.value !== '}') {
      const statement = this.parse_statement();
      statements.push(statement);
    }

    return statements;
  }

  parse_statement() {
    switch (this.current.type) {
      case 'ID': {
        // variable definition
        if (this.current.value === 'let') {
          return this.parse_variable_definition();
        }

        // function call
        if (this.peek().value === '(') {
          return this.parse_function_call();
        }

        // function definition
        if (this.current.value === 'fun') {
          return this.parse_function_definition();
        }

        // return statement
        if (this.current.value === 'return') {
          return this.parse_return();
        }
      }
      case 'PUNC': {
        // load
        if (this.current.value === '@') {
          return this.parse_load();
        }
      }
    }
  }

  parse_load() {
    this.expect('PUNC', '@');
    this.expect('ID', 'load');
    const path = this.expect('STRING').value;
    this.expect('PUNC', ';');

    return { type: 'LoadStmt', value: path };
  }

  parse_return() {
    this.expect('ID', 'return');
    const expr = this.parse_expr();
    this.expect('PUNC', ';');

    return { type: 'ReturnStmt', value: expr };
  }

  parse_variable_definition() {
    this.expect('ID', 'let');
    const name = this.expect('ID').value;
    this.expect('PUNC', '=');
    const body = this.parse_expr();
    this.expect('PUNC', ';');

    return { type: 'VarDef', name, body };
  }

  parse_function_call(asExpr = false) {
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    const params = this.parse_expr();
    this.expect('PUNC', ')');
    if (!asExpr) {
      this.expect('PUNC', ';');
    }

    return { type: 'FuncCall', name, params };
  }

  parse_function_definition() {
    this.expect('ID', 'fun');
    const name = this.expect('ID').value;
    this.expect('PUNC', '(');
    // TODO parse function args
    this.expect('PUNC', ')');
    this.expect('PUNC', '=>');
    this.expect('PUNC', '{');
    const body = this.parse_statements();
    this.expect('PUNC', '}');

    return { type: 'FuncDef', name, body };
  }

  parse_expr() {
    switch (this.current.type) {
      case 'STRING':
        return this.advance().value;

      case 'NUMBER':
        return parseFloat(this.advance().value);

      case 'ID':
        // variable definitions for example can contain a function call
        if (this.peek().value === '(') {
          return this.parse_function_call(true);
        } else {
          return this.advance().value;
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
      this.unexpected_token_errmsg(tokenType);
    }
  }

  expect_with(tokenType, tokenValue) {
    if (this.current.type === tokenType && this.current.value === tokenValue) {
      return this.advance();
    } else {
      this.unexpected_token_errmsg(tokenValue);
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

  unexpected_token_errmsg(tokenValue) {
    throw new Error(
      `Unexpected token at ${this.current.line}:${this.current.col} => '${this.current.value}', expected '${tokenValue}'`
    );
  }
}

module.exports = Parser;
