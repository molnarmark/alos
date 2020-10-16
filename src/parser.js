class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.current = this.tokens[this.pos];
  }

  parse() {
    return this.parse_statements();
  }

  parse_statements() {
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
      }
    }
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
