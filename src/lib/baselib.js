var path = require("path");
var fs = require("fs");
var vm = require("vm");

var types = require("./types.js");
var scope = require("./Scope.js");
GLOBAL.scope = scope;

var parser = require("luaparse");
var compile = require("./../compiler.js");

var cache = [];
var stdlib = {};
var srcPath;

exports.setSrcPath = function(_srcPath)
{
    srcPath = _srcPath;
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

scope.set("import", function(name)
{
    var file;
    if(stdlib.hasOwnProperty(name))
    {
        file = stdlib[name];
    }
    else
    {
        file = path.resolve(path.join(srcPath, name));
        if(!fs.existsSync(file))
            throw "cannot import module " + name + ", file does not exist";
    }

    if(cache.indexOf(file) != -1)
        return;
    cache.push(file);

    var ext = path.extname(file);

    if(ext == ".lua")
    {
        var _srcPath = srcPath;
        srcPath = path.dirname(file);
        var src = fs.readFileSync(file).toString();
        var ast = parser.parse(src, {locations: true});
        compile(ast, path.dirname(file), false);
        srcPath = _srcPath;
    }
    else if(ext == ".js")
    {
        var obj = require(file);
        for(var key in obj)
        {
            scope.set(key, obj[key]);
        }
    }
    else
    {
        throw "cannot import module " + name + ", unknown file extension " + ext;
    }
});

scope.set("js_eval", function(code)
{
    var context = {};
    for(var i = 0; i < scope.stack.length; i++)
    {
        for(var key in scope[i])
            context[key] = scope[i][key];
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
