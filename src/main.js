GLOBAL.options = {splitterBlock: "air", length: 20, output: "rcon"};

var fs = require("fs");
var path = require("path");
var parser = require("luaparse");
var base = require("./lib/base.js");
var output = require("./output/" + options.output + ".js");
var compile = require("./compiler.js");

String.prototype.format = function()
{
	var val = this;
	for(var i = 0; i < arguments.length; i++)
		val = val.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
	return val;
};

try
{
    var file = process.argv.slice(2).join(" ");
    if(!file.trim() || !fs.existsSync(file))
        throw "usage: node main.js <file>";

    var src = fs.readFileSync(file).toString();
    var ast = parser.parse(src, {locations: true});
    fs.writeFileSync("dump.json", JSON.stringify(ast, undefined, 4));

    compile(ast, path.dirname(file));

	base.output(output);

    console.log("done");
}
catch(e)
{
    console.log(e.toString());
    throw e;
    process.exit(1);
}
