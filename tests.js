var parser = require("luaparse");
var fs = require("fs");

var src = fs.readFileSync("in.lua").toString();
var ast = parser.parse(src);
fs.writeFileSync("out.json", JSON.stringify(ast, undefined, 4));
