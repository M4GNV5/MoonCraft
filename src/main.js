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
			var arg = args[i][1] == "-" ? args[i].substr(2) : args[i][1];

			i++;
			var val = true;

			if(args[i][0] == "-")
				i--;
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
	options.rcon_ip = options.rcon_ip || config.rcon_ip || "localhost";
	options.rcon_port = options.rcon_port || config.rcon_port || 25575;
	options.rcon_password = options.rcon_password || options.rcon_pw || config.rcon_password || "hunter2";
	options.schematic_file = options.schematic_file || options.file || config.schematic_file || "output.schematic";
	options.debug = options.debug || config.debug || false;
	options.export = options.export || config.export || false;

	var output = require("./output/" + options.output + ".js");
	var parser = require("./luaparse.js");
	var base = require("./lib/base.js");
	var baseLib = require("./lib/baselib.js");
	var compile = require("./compiler.js");
	var luaExport = require("./lib/export.js");

    if(files.length == 0)
		throw "No input files specified";

	baseLib.srcPath = process.cwd();

	for(var i = 0; i < files.length; i++)
	{
		baseLib.import(files[i], i + 1 == files.length);
	}

	command("__DONE__");

	base.output(function(blocks, cmdBlocks)
	{
		if(options.export)
			luaExport(options.export);

		console.log("Code compiled to {0} command and {1} other blocks".format(cmdBlocks.length, blocks.length));
		output(blocks, cmdBlocks);
	});
}
catch(e)
{
	if(options.debug)
		throw e;

	var err = typeof e == "undefined" ? "Unknown error occured" : e.toString();
    console.log(err);
    process.exit(1);
}
