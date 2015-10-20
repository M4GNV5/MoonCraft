var fs = require("fs");

var file = process.argv.slice(2).join(" ");
if(!file.trim() || !fs.existsSync(file))
{
    console.log("usage: node main.js <file>");
    process.exit(1);
}

GLOBAL.options = {splitterBlock: "air", length: 20};

var base = require("./lib/base.js");
var src = fs.readFileSync(file).toString();
var run = require("./parser.js").parser.parse(src);
run();
base.output(require("./output/rcon.js"));
