const Token = require('./token');

class Lexer {
  constructor(source) {
    this.source = source + '\0';
    this.line = 0;
    this.col = 0;
    this.pos = -1;

    this.tokens = [];
  }
  lex() {
    let current = null;

    while (true) {
      current = this.advance();

      if (this.isEof(current)) {
        this.tokens.push(new Token('EOF', '\0', this.line, this.col));
        break;
      }

      switch (current) {
        // Punctuations
        case '(':
        case ')':
        case '<':
        case '>':
        case '{':
        case '}':
        case ';':
        case ',':
        case '@':
        case '=':
          this.tokens.push(new Token('PUNC', current, this.line, this.col));
          continue;

        // Operators
        case '+':
        case '-':
          if (this.lookahead() === '>') {
            this.tokens.push(new Token('PUNC', '->', this.line, this.col));
            this.advance();
          } else {
            this.tokens.push(new Token('OP', current, this.line, this.col));
          }
          continue;
        case '/':
        case '%':
        case '*':
          this.tokens.push(new Token('OP', current, this.line, this.col));
          continue;
      }

      // Reading Identifier
      if (!this.isNumber(current)) {
        if (current !== '"') {
          this.tokens.push(this.readIdentifier(current));
          continue;
        }
      }

      if (this.isNumber(current)) {
        this.tokens.push(this.readNumber(current));
        continue;
      }

      // Reading String
      if (current === '"') {
        this.tokens.push(this.readString());
        continue;
      }
    }

    return this.tokens.filter((x) => x.value.length > 0);
  }

  advance() {
    this.pos++;
    const nextChar = this.source.charAt(this.pos);
    if (nextChar === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
      // this.col += this.tokens.length !== 0 ? this.tokens.pop().value.length : 1;
    }

    return nextChar;
  }

  peek() {
    return this.source.charAt(this.pos);
  }

  lookahead() {
    return this.source.charAt(this.pos + 1);
  }

  readIdentifier(char) {
    let identifier = char;

    while (this.isLetter(this.lookahead()) || this.isNumber(this.lookahead())) {
      if (this.lookahead() === ' ') {
        break;
      }
      identifier += this.advance();
    }

    const type = identifier.includes('@') ? 'BUILTIN_ID' : 'ID';
    return new Token(type, identifier.trim(), this.line, this.col);
  }

  readString() {
    let str = this.advance();
    while (this.peek() !== '"') {
      str += this.advance();
    }

    return new Token('STRING', str.trim().replace('"', ''), this.line, this.col);
  }

  readNumber(char) {
    let str = char;
    while (this.isNumber(this.lookahead()) || this.lookahead() === '.') {
      str += this.advance();
    }

    return new Token('NUMBER', str.trim().replace('"', ''), this.line, this.col);
  }

  isEof(char) {
    return char === '\0';
  }

  isWhitespace(char) {
    return char === ' ' || char === '\t';
  }

  isNumber(char) {
    return !isNaN(char);
  }

  isLetter(char) {
    return /[a-z]|\_/i.test(char);
  }
}

module.exports = Lexer;
