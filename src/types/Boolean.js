var nextName = require("./../lib/naming.js");
var Integer = require("./Integer.js");
var String = require("./String.js");

function Boolean(startVal, name)
{
    this.name = name || nextName("bool");

    if(startVal instanceof Boolean)
        startVal = startVal.base;
    else if(typeof startVal.toInteger == "function")
        startVal = startVal;
    else
        startVal = startVal ? 1 : 0;

    this.base = new Integer(startVal, this.name);
}

Boolean.prototype.set = function(val, conditional)
{
    if(val instanceof Boolean)
        this.base.set(val.base, conditional);
    else if(typeof val.toInteger == "function")
        this.base.set(val, conditional);
    else if(typeof val == "boolean")
        this.base.set(val ? 1 : 0, conditional);
    else
        throw "Cannot assing '" + val.constructor.name + "' to a Boolean" + (new Error()).stack;
};

Boolean.prototype.toInteger = function()
{
    return this.base;
};

Boolean.prototype.clone = function(cloneName)
{
    return new Boolean(this, cloneName);
};

Boolean.prototype.toTellrawExtra = function()
{
    var val = new String("false");
    command(this.isExact(true));
    val.set("true", true);
    return val.toTellrawExtra();
};

Boolean.prototype.isExact = function(val)
{
    return this.base.isExact(val ? 1 : 0);
};

module.exports = Boolean;
