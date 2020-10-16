class Visitor {
  constructor() {
    // temporary scope
    this.scope = {};
  }

  visit(astNode) {
    // console.log('Visiting', astNode.type);
    switch (astNode.type) {
      case 'VarDef':
        return this.visitVarDef(astNode);
      case 'Variable':
        return this.visitVar(astNode);
      case 'FuncCall':
        return this.visitFunctionCall(astNode);
      case 'String':
        return this.visitString(astNode);
      case 'Number':
        return this.visitNumber(astNode);
      case 'TopLevel':
        return this.visitTopLevel(astNode);
    }

    console.log('Err');
    process.exit(0);
  }

  visitTopLevel(astNode) {
    for (let child of astNode.children) {
      this.visit(child);
    }
  }

  visitVarDef(astNode) {
    this.scope[astNode.name] = this.visit(astNode.value);
  }

  visitVar(astNode) {
    return this.scope[astNode.value];
  }

  visitFunctionCall(astNode) {
    if (astNode.name === 'println') {
      const printWhat = this.visit(astNode.value);
      console.log(printWhat);
    }
  }

  visitString(astNode) {
    return astNode.value;
  }

  visitNumber(astNode) {
    return astNode.value;
  }
}

module.exports = Visitor;
