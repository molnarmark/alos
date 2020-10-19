const ipfix = require('ipfix');

const Builtins = require('../builtins');
const { error, debug } = require('../reporter');

const Scope = require('./scope');
const ASTNode = require('../parser/node');

class Evaluator {
  constructor() {
    // first is the global scope
    this.scopes = [new Scope()];
    this.currentScope = this.scopes[0];
  }

  visit(astNode) {
    // debug('Visiting', astNode.type);
    // if (!astNode.type) return null;

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
      case 'BuiltinFuncCall':
        return this.visitBuiltinFunctionCall(astNode);
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
      case 'ModuleDef':
        return this.visitModuleDef(astNode);
      case 'ReturnStmt':
        return this.visit(astNode.value);
      case 'TopLevel':
        return this.visitTopLevel(astNode);
      case 'NoOp':
        return 0;
    }

    error(`Unable to handle AST Node of type: ${astNode.type} ${astNode.value}`);
  }

  visitTopLevel(astNode) {
    for (let child of astNode.nodes) {
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

  visitModuleDef(astNode) {}

  visitBinaryExpr(astNode) {
    return ipfix.calculate(astNode.value);
  }

  visitVarDef(astNode) {
    this.currentScope.addVar(astNode);
  }

  visitFixedVarDef(astNode) {
    this.currentScope.addVar(astNode, true);
  }

  visitVarAssignment(astNode) {
    const success = this.currentScope.setVar(astNode);
    if (!success) {
      error(`Trying to set fixed variable \`${astNode.name}\``);
    }
  }

  visitVar(astNode) {
    const variable = this.lookupVar(astNode.value);
    if (!variable) {
      error(`Undefined variable \`${astNode.value}\``);
    }
    return this.visit(variable.value);
  }

  visitFunctionCall(astNode) {
    const funcDef = this.currentScope.getSub(astNode.name);
    this.pushScope();

    for (let i in funcDef.args) {
      this.currentScope.addVar(
        new ASTNode('VarDef', astNode.value.value[i], funcDef.args[i].value)
      );
    }

    let returnVal;
    for (let value of funcDef.value) {
      returnVal = this.visit(value);
    }

    this.popScope();
    return returnVal;
  }

  visitBuiltinFunctionCall(astNode) {
    const arg = astNode.value.value.map((x) => this.visit(x));
    Builtins[astNode.name](arg);
  }

  visitFunctionDef(astNode) {
    this.currentScope.addSub(astNode);
  }

  visitString(astNode) {
    return astNode.value;
  }

  visitNumber(astNode) {
    return astNode.value;
  }

  getCurrentScope() {
    return this.currentScope;
  }

  getScopes() {
    return this.scopes;
  }

  pushScope() {
    this.scopes.push(new Scope());
    this.currentScope = this.scopes[this.scopes.length - 1];
    debug('Created new scope');
  }

  popScope() {
    debug('Popped top scope. Current scope length:' + this.scopes.length);
    this.scopes.pop();

    this.currentScope = this.scopes[this.scopes.length - 1];
  }

  lookupVar(name) {
    const foundVar = this.currentScope.getVar(name);

    return foundVar
      ? foundVar
      : [...this.scopes].reverse().filter((x) => (x.getVar(name) ? x.getVar(name) : null))[0];
  }
}

module.exports = Evaluator;
