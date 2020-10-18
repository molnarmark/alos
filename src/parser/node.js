class ASTNode {
  constructor(type, value, name, args) {
    this.type = type;
    this.value = value;
    if (name) this.name = name;
    if (args) this.args = args;
  }
}

module.exports = ASTNode;
