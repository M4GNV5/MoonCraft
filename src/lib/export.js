var fs = require("fs");
var types = require("./types.js");
var base = require("./base.js");
var nextName = require("./naming.js");

scope.setGlobal("__extern_naming", function(data)
{
    var data = JSON.parse(data);
    for(var key in data)
        nextName.data[key] += data[key];
});

scope.setGlobal("__extern_statics", function(data)
{
    types.Integer.statics = types.Integer.statics.concat(JSON.parse(data));
});

scope.setGlobal("__extern", function(name, pos, args, ret)
{
    base.jmpLabel[name] = {x: pos[0], y: pos[1], z: pos[2]};

    scope.setGlobal(name, function()
    {
        if(args.length != arguments.length)
            throw "function {0} requires {1} arguments not {2}".format(name, args.length, arguments.length);

        var _ret = [];
        for(var i = 0; i < ret.length; i++)
        {
            var ctor = types[ret[i][0]];
            var _name = ret[i][1];

            _ret[i] = new ctor(0, _name);
        }

        for(var i = 0; i < args.length; i++)
        {
            var ctor = types[args[i][0]];
            var _name = args[i][1];

            new ctor(arguments[i], _name);
        }

        base.rjump(name);
        return _ret;
    });
});

module.exports = function(file)
{
    var globals = scope.stack[0];
    var namingData = nextName.data;
    var statics = types.Integer.statics;
    var jmpLabel = base.jmpLabel;

    var exportCode = "-- auto generated code, you should probably not change anything";

    exportCode += "\n__extern_naming({0})".format(JSON.stringify(JSON.stringify(namingData)));
    exportCode += "\n__extern_statics({0})".format(JSON.stringify(JSON.stringify(statics)));

    for(var key in globals)
    {
        if(typeof globals[key] != "function" || !globals[key].funcName)
            continue;

        var name = JSON.stringify(globals[key].funcName);
        var typeSignature = tabelify(globals[key].typeSignature);
        var returnSignature = tabelify(globals[key].returnSignature);

        var pos = jmpLabel[key];
        var _pos = "{{0}, {1}, {2}}".format(pos.x, pos.y, pos.z);

        exportCode += "\n__extern({0}, {1}, {2}, {3})".format(name, _pos, typeSignature, returnSignature);
    }

    fs.writeFileSync(file, exportCode);
}

function tabelify(args)
{
    var entries = [];
    for(var i = 0; i < args.length; i++)
    {
        var ctorName = JSON.stringify(args[i].constructor.name);
        var name = JSON.stringify(args[i].selector || args[i].name);
        entries.push("{{0}, {1}}".format(ctorName, name));
    }
    return "{" + entries.join(", ") + "}";
}
