class Scope {
  constructor() {
    this.vars = new Map();
    this.subs = new Map();
    this.fixedVars = [];
  }

  addVar(node, fixed) {
    this.vars.set(node.name, node);

    if (fixed) {
      this.fixedVars.push(node.name);
    }
  }

  setVar(node) {
    if (this.fixedVars.includes(node.name)) {
      return false;
    }

    this.vars.set(node.name, node);
    return true;
  }

  addSub(node) {
    this.subs.set(node.name, node);
  }

  getSub(name) {
    return this.subs.get(name);
  }

  getVar(name) {
    return this.vars.get(name);
  }

  hasVar(name) {
    return this.vars.get(name) !== null;
  }
}

module.exports = Scope;
