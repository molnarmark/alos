const ipfix = require('ipfix');

const Builtins = require('./builtins');
const { error } = require('./reporter');

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
      case 'FuncDef':
        return this.visitFunctionDef(astNode);
      case 'FuncCall':
        return this.visitFunctionCall(astNode);
      case 'String':
        return this.visitString(astNode);
      case 'Number':
        return this.visitNumber(astNode);
      case 'BinaryExpr':
        return this.visitBinaryExpr(astNode);
      case 'ArgList':
        return this.visitArgList(astNode);
      case 'Block':
        return this.visitBlock(astNode);
      case 'TopLevel':
        return this.visitTopLevel(astNode);
      case 'NoOp':
        return 0;
    }

    error(`Unable to handle AST Node of type: ${astNode.type}`);
  }

  visitTopLevel(astNode) {
    for (let child of astNode.children) {
      this.visit(child);
    }
  }

  visitBlock(astNode) {
    for (let child of astNode.value) {
      this.visit(child);
    }
  }

  visitArgList(astNode) {
    for (let child of astNode.value) {
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
      error(`Assignment to fixed variable: ${astNode.name}`);
    }
    this.scope[astNode.name].value = this.visit(astNode.value);
  }

  visitVar(astNode) {
    return this.scope[astNode.value].value;
  }

  visitFunctionCall(astNode) {
    const arg = astNode.value.value.map((x) => this.visit(x));
    Builtins[astNode.name](arg);
  }

  visitFunctionDef(astNode) {}

  visitString(astNode) {
    return astNode.value;
  }

  visitNumber(astNode) {
    return astNode.value;
  }
}

module.exports = Visitor;
