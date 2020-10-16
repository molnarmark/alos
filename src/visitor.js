const ipfix = require('ipfix');

const Builtins = require('./builtins');

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
      case 'VarAssignment':
        return this.visitVarAssignment(astNode);
      case 'FixedVarDef':
        return this.visitFixedVarDef(astNode);
      case 'Variable':
        return this.visitVar(astNode);
      case 'FuncCall':
        return this.visitFunctionCall(astNode);
      case 'String':
        return this.visitString(astNode);
      case 'Number':
        return this.visitNumber(astNode);
      case 'BinaryExpr':
        return this.visitBinaryExpr(astNode);
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

  visitBinaryExpr(astNode) {
    return ipfix.calculate(astNode.value);
  }

  visitVarDef(astNode) {
    this.scope[astNode.name] = {
      value: this.visit(astNode.value),
      fixed: false,
    };
  }

  visitFixedVarDef(astNode) {
    this.scope[astNode.name] = {
      value: this.visit(astNode.value),
      fixed: true,
    };
  }

  visitVarAssignment(astNode) {
    if (this.scope[astNode.name].fixed === true) {
      throw new Error(`Assignment to fixed variable: ${astNode.name}`);
    }
    this.scope[astNode.name].value = this.visit(astNode.value);
  }

  visitVar(astNode) {
    return this.scope[astNode.value].value;
  }

  visitFunctionCall(astNode) {
    const arg = this.visit(astNode.value);
    Builtins[astNode.name](arg);
  }

  visitString(astNode) {
    return astNode.value;
  }

  visitNumber(astNode) {
    return astNode.value;
  }
}

module.exports = Visitor;
