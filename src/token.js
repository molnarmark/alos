// prettier-ignore
const TokenType = {
  KEYWORD: null,     // let, fixed
  IDENTIFIER: null,  // name
  NUMBER: null,         // 1, 5, 10
  STRING: null,      // "value"

  // Punctuation

  LPAREN: null,      // (
  RPAREN: null,      // )
  EQ: null,          // =
  LT: null,          // <
  GT: null,          // >
  LCURLY: null,      // {
  RCURLY: null,      // }
  SEMI: null,        // ;
  COMMA: null,       // ,
  SINGLEQUOTE: null, // '
  DOUBLEQUOTE: null, // "

  // Misc
  EOF: null
};

class Token {
  constructor(type, value, line, col) {
    this.type = type;
    this.value = value;

    this.line = line;
    this.col = col;
  }
}

module.exports = { TokenType, Token };
