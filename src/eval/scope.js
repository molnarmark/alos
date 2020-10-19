class Scope {
  constructor() {
    this.vars = new Map();
    this.subs = new Map();
  }

  addVar(node) {
    this.vars.set(node.name, node);
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
