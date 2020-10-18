class ASTNode {
  constructor(type, value, name, args) {
    this.type = type;
    this.value = value;
    if (this.name) this.name = name;
    if (this.args) this.args = args;
  }
}

module.exports = ASTNode;
