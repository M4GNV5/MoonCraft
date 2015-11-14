var path = require("path");
var fs = require("fs");

var types = require("./types.js");

var parser = require("luaparse");
var compile = require("./../compiler.js");

var scope = compile.scope;

var cache = [];
var stdlib = {};

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
        var src = fs.readFileSync(file).toString();
        var ast = parser.parse(src, {locations: true});
        compile(ast, path.dirname(file), false);
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
