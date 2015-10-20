var naming = require("./../naming.js");
var Integer = require("./Integer.js");

function Float(startVal, name)
{
    this.name = name || naming.next("float");

    if(startVal instanceof Float)
    {
        startVal = startVal.base;
    }
    else if(typeof startVal == "object" && startVal.toInteger)
    {
        startVal = startVal.toInteger().clone();
        startVal.multiplicate(Float.accuracy);
    }
    else if(typeof startVal == "number")
    {
        startVal = Math.round(startVal * Float.accuracy);
    }
    else
    {
        throw "Cannot assing '" + startVal.constructor.name + "' to a Float";
    }

    this.base = new Integer(startVal, name);
}

Float.accuracy = 2; //digits after the comma

Float.accuracy = Math.pow(10, Float.accuracy);

function convertStatic(val)
{
    var _val = Math.round(val * Float.accuracy);
    return _val;
}

Float.prototype.set = function(val)
{
    if(val instanceof Float)
    {
        this.base.set(val.base);
    }
    else if(typeof val.toInteger == "function")
    {
        this.base.set(val.toInteger());
        this.multiplicate(100);
    }
    else if(typeof val == "number")
    {
        this.base.set(convertStatic(val));
    }
    else
    {
        throw "Cannot assing '" + val.constructor.name + "' to a Float";
    }
}

Float.prototype.add = function(val)
{
    if(val instanceof Float)
    {
        this.base.add(val.base);
    }
    else if(typeof val.toInteger == "function")
    {
        val = val.toInteger().clone();
        val.multiplicate(100);
        this.base.add(val);
    }
    else if(typeof val == "number")
    {
        this.base.add(convertStatic(val));
    }
    else
    {
        throw "Cannot add '" + val.constructor.name + "' to a Float";
    }
}

Float.prototype.remove = function(val)
{
    if(val instanceof Float)
    {
        this.base.remove(val.base);
    }
    else if(typeof val.toInteger == "function")
    {
        val = val.toInteger().clone();
        val.multiplicate(100);
        this.base.remove(val);
    }
    else if(typeof val == "number")
    {
        this.base.remove(convertStatic(val));
    }
    else
    {
        throw "Cannot remove '" + val.constructor.name + "' from a Float";
    }
}

Float.prototype.multiplicate = function(val)
{
    if(val instanceof Float)
    {
        this.base.multiplicate(val.base);
        this.base.divide(100);
    }
    else if(typeof val.toInteger == "function")
    {
        this.base.multiplicate(val);
    }
    else if(typeof val == "number")
    {
        this.base.multiplicate(convertStatic(val));
        this.base.divide(100);
    }
    else
    {
        throw "Cannot multiplicate '" + val.constructor.name + "' with a Float";
    }
}

Float.prototype.divide = function(val)
{
    if(val instanceof Float)
    {
        this.base.multiplicate(100);
        this.base.divide(val.base);
    }
    else if(typeof val.toInteger == "function")
    {
        this.base.divide(val);
    }
    else if(typeof val == "number")
    {
        this.base.multiplicate(100);
        this.base.divide(convertStatic(val));
    }
    else
    {
        throw "Cannot divide a Float through '" + val.constructor.name + "'";
    }
}

Float.prototype.mod = function(val)
{
    if(val instanceof Float)
    {
        this.base.mod(val.base);
    }
    else if(typeof val.toInteger == "function")
    {
        val = val.toInteger().clone();
        val.multiplicate(Float.accuracy);
        this.base.mod(val);
    }
    else if(typeof val == "number")
    {
        this.base.mod(convertStatic(val));
    }
    else
    {
        throw "Cannot assing '" + val.constructor.name + "' to a Float";
    }
}

Float.prototype.toInteger = function()
{
    var val = this.base.clone();
    val.divide(Float.accuracy);
    return val;
}

Float.prototype.clone = function(cloneName)
{
    return new Float(this, cloneName);
}

Float.prototype.toTellrawExtra = function()
{
    var val = this.toInteger();
    return {score: {objective: Integer.scoreName, name: val.name}};
}

Float.prototype.isExact = function(val)
{
    val = convertStatic(val) || val;
    return this.base.isBetween(val, val);
}

Float.prototype.isBetweenEx = function(min, max)
{
    min = convertStatic(min) || min;
    max = convertStatic(max) || max;
    return this.base.isBetweenEx(min, max);
}

Float.prototype.isBetween = function(min, max)
{
    min = convertStatic(min) || min;
    max = convertStatic(max) || max;

    return this.base.isBetween(min, max);
}

module.exports = Float;
