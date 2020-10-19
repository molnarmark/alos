# Alos Programming Language

## The Plan

```perl
module main;

# imports folder/file.alos
use "folder/file";

let a = "Random string";
fixed b = "Random fixed string";

# Builtins get called with @
@println(a, b);

sub blockSub(a, b) -> {
  return 1;
}

sub arrowSub(a, b) -> 1;

blockSub(a, b);
```

## Roadmap

### Lexer & Parser

- [x] Variable Definitions
  - [x] Variable reassignment
  - [x] fixed (const) variables
- [x] Function Definitions
- [x] Binary Expressions
  - [x] Evaluation (infix -> postfix)
- [x] use statement
- [x] module definition
- [x] Builtin debug functions (@print & @println)
- [x] Grouped expressions
- [x] Blocks
- [x] Argument lists
- [ ] If statement
- [ ] One fixed loop type
- [ ] Ternary operator
- [ ] Increment, decrement (++, --, += -=) operators
- [ ] not (!) operator
- [ ] Comparison (==, !=, >, < >=, <=) operators

### Evaluator / Interpreter

- [x] Scopes
- [x] Function calls
- [x] Function argument passing
- [ ] Module loading, namespaces
