var path = require("path");
var fs = require("fs");

var types = require("./types.js");

var parser = require("luaparse");
var compile = require("./../compiler.js");

module.exports = function addBaseLib(scope, srcPath)
{
    var oldImport = scope.get("import");
    if(oldImport)
        return;

    scope.set("command", require("./base.js").command);
    scope.set("import", function(relPath)
    {
        var file = path.resolve(path.join(srcPath, relPath));
        if(!fs.existsSync(file))
            throw "cannot import module " + srcPath + ", file does not exist";

        var ext = path.extname(file);

        if(ext == ".lua")
        {
            var src = fs.readFileSync(file).toString();
            var ast = parser.parse(src, {locations: true});
            compile(ast, path.dirname(file));
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
            throw "cannot import module " + srcPath + ", unknown file extension " + ext;
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
}
