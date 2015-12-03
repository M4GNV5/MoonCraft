GLOBAL.options = {};

var fs = require("fs");
var path = require("path");

String.prototype.format = function()
{
	var val = this;
	for(var i = 0; i < arguments.length; i++)
		val = val.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
	return val;
};

try
{
	var args = process.argv.slice(2);
	var files = [];

	for(var i = 0; i < args.length; i++)
	{
		if(args[i][0] != "-")
		{
			files.push(args[i]);
		}
		else
		{
			var arg = args[i][1] == "-" ? args[i].substr(0, 2) : args[i][1];

			i++;
			var val;

			if(args[i][0] == "-")
				val = true;
			else
				val = args[i];

			options[arg] = val;
		}
	}

	var config = {};
	if(fs.existsSync("./config.json"))
		config = JSON.parse(fs.readFileSync("./config.json"));

	options.output = options.output || config.output || "rcon";
	options.splitterBlock = options.splitterBlock || options.split || config.splitterBlock || "air";
	options.x = options.x || config.x || 0;
	options.y = options.y || config.y || 0;
	options.z = options.z || config.z || 0;
	options.length = options.length || options.l || config.length || 20;
	options.returnType = options.returnType || config.returnType || "Float";
	options.rcon_ip = options.rcon_ip || config.rcon_ip || "localhost";
	options.rcon_port = options.rcon_port || config.rcon_port || 25575;
	options.rcon_password = options.rcon_password || options.rcon_pw || config.rcon_password || "hunter2";
	options.schematic_file = options.schematic_file || options.file || config.schematic_file || "output.schematic";

	var output = require("./output/" + options.output + ".js");
	var parser = require("luaparse");
	var base = require("./lib/base.js");
	var baseLib = require("./lib/baselib.js");
	var compile = require("./compiler.js");

	baseLib.setSrcPath(path.dirname(files[i]));

    if(files.length == 0)
		throw "No input files specified";

	for(var i = 0; i < files.length; i++)
	{
		var src = fs.readFileSync(files[i]).toString();
	    var ast = parser.parse(src, {locations: true});
		compile(ast, path.dirname(files[i]), true);
	}
	command("__DONE__");

	console.log("done");
	base.output(output);
}
catch(e)
{
	var err = typeof e == "undefined" ? "Unknown error occured" : e.toString();
    console.log(err);
    process.exit(1);
}
