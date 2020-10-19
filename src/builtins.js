module.exports = {
  println: val => console.log(...val),
  print: val => val.map(x => String(x)).map(x => process.stdout.write(x)),
};
