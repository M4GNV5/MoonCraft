var naming = require("./../naming.js");
var Integer = require("./Integer.js");

function Boolean(startVal, name)
{
    this.name = name || naming.next("bool");

    if(startVal instanceof Boolean)
        startVal = startVal.base;
    else if(typeof startVal.toInteger == "function")
        startVal = startVal;
    else
        startVal = startVal ? 1 : 0;

    this.base = new Integer(startVal, name);
}

Boolean.prototype.set = function(val)
{
    if(val instanceof Boolean)
        this.base.set(val.base);
    else if(typeof val.toInteger == "function")
        this.base.set(val);
    else if(typeof val == "boolean")
        this.base.set(val ? 1 : 0);
    else
        throw "Cannot assing '" + val.constructor.name + "' to a Boolean";
}

Boolean.prototype.toInteger = function()
{
    return this.base;
}

Boolean.prototype.clone = function(cloneName)
{
    return new Boolean(this, cloneName);
}

Boolean.prototype.toTellrawExtra = function()
{
    return {score: {objective: Integer.scoreName, name: this.name}};
}

Boolean.prototype.isExact = function(val)
{
    return this.base.isExact(val ? 1 : 0);
}

module.exports = Boolean;
