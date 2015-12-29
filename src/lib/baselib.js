var path = require("path");
var fs = require("fs");
var vm = require("vm");

var types = require("./types.js");
var scope = require("./Scope.js");
var base = require("./base.js");
GLOBAL.scope = scope;

var parser = require("./../luaparse.js");
var compile = require("./../compiler.js");

var cache = [];
var stdlib = {};
exports.srcPath = "";

exports.import = function(name, isMain)
{
    luaImport(name);

    if(isMain)
    {
        var Integer = types.Integer;
        for(var i = 0; i < Integer.statics.length; i++)
            base.unshiftCommand(["scoreboard players set", "static" + Integer.statics[i], Integer.scoreName, Integer.statics[i]].join(" "));

        base.unshiftCommand("scoreboard objectives add " + Integer.scoreName + " dummy MoonCraft Variables");
        base.unshiftCommand("scoreboard objectives add " + types.Table.indexScoreName + " dummy MoonCraft Table");
        base.unshiftCommand("scoreboard objectives add " + types.Table.tmpScoreName + " dummy MoonCraft temp");
    }
};

(function()
{
    var stdlibPath = path.join(__dirname, "../../stdlib/");
    var files = fs.readdirSync(stdlibPath); //had trouble with async version

    for(var i = 0; i < files.length; i++)
    {
        var ext = path.extname(files[i]);
        var name = path.basename(files[i], ext);

        if(ext == ".js" || ext == ".lua")
            stdlib[name] = path.join(stdlibPath, files[i]);
    }
})();

scope.set("command", require("./base.js").command);

scope.set("import", luaImport);
function luaImport(name)
{
    var file;
    if(stdlib.hasOwnProperty(name))
    {
        file = stdlib[name];
    }
    else
    {
        if(path.isAbsolute(name))
            file = name;
        else
            file = path.resolve(path.join(exports.srcPath, name));

        if(!fs.existsSync(file))
            throw "cannot import module " + name + ", file " + file + " does not exist";
    }

    if(cache.indexOf(file) != -1)
        return;
    cache.push(file);

    var ext = path.extname(file);

    if(ext == ".lua")
    {
        var oldStack = scope.save();
        scope.load([scope.stack[0]]);
        scope.increase();

        var _srcPath = exports.srcPath;
        exports.srcPath = path.dirname(file);
        var _file = compile.file;
        compile.file = file;

        try
        {
            var src = fs.readFileSync(file).toString();
            var ast = parser.parse(src, {locations: true});
        }
        catch(e)
        {
            console.log("in file " + file);
            throw e;
        }
        compile(ast, path.dirname(file), false);

        exports.srcPath = _srcPath;
        compile.file = _file;

        scope.load(oldStack);
    }
    else if(ext == ".js")
    {
        var obj = require(file);
        for(var key in obj)
        {
            scope.setGlobal(key, obj[key]);
        }
    }
    else
    {
        throw "cannot import module " + name + ", unknown file extension " + ext;
    }
}

scope.set("js_eval", function(code)
{
    var context = {};
    for(var i = 0; i < scope.stack.length; i++)
    {
        for(var key in scope.stack[i])
            context[key] = scope.stack[i][key];
    }

    context = vm.createContext(context);
    return vm.runInContext(code, context);
});

scope.set("boolean", function(val, name)
{
    return new types.Boolean(val || false, name);
});

scope.set("int", function(val, name)
{
    return new types.Integer(val || 0, name);
});

scope.set("float", function(val, name)
{
    return new types.Float(val || 0, name);
});

scope.set("string", function(val, name)
{
    return new types.String(val || "", name);
});

scope.set("score", function(selector, objective)
{
    return new types.Score(selector, objective);
});

scope.set("type", function(val)
{
    return val.constructor.name;
});

scope.set("table_getn", function(table)
{
    return table.length;
});

scope.set("table_maxn", function(table)
{
    return table.maxn;
});

scope.set("table_slice", function(table, start, end)
{
    table.slice(start, end);
});

scope.set("table_insert", function(table, index, value)
{
    table.insert(index, value);
});

scope.set("table_remove", function(table, index)
{
    table.remove(index);
});

scope.set("OBJECTIVE_NAME", types.Integer.scoreName);
