var Integer = require("./Integer.js");

function Score(selector, scoreName)
{
    if(typeof Integer == "object") //fix cross requiring
        Integer = require("./Integer.js");

    this.selector = selector;
    this.scoreName = scoreName;
}

Score.prototype.set = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("=", val.selector, val.scoreName, conditional);
    else if(typeof val.toInteger == "function")
        this.operation("=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        command(["scoreboard players set", this.selector, this.scoreName, val].join(" "), conditional);
    else
        throw "Cannot assing '" + val.constructor.name + "' to a Score";
};

Score.prototype.add = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("+=", val.selector, val.scoreName, conditional);
    else if(typeof val == "object" && typeof val.toInteger == "function")
        this.operation("+=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        command(["scoreboard players add", this.selector, this.scoreName, val].join(" "), conditional);
    else
        throw "Cannot add '" + val.constructor.name + "' to a Score";
};

Score.prototype.remove = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("-=", val.selector, val.scoreName, conditional);
    else if(typeof val == "object" && typeof val.toInteger == "function")
        this.operation("-=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        command(["scoreboard players remove", this.selector, this.scoreName, val].join(" "), conditional);
    else
        throw "Cannot remove '" + val.constructor.name + "' to a Score";
};

Score.prototype.multiplicate = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("*=", val.selector, val.scoreName, conditional);
    else if(typeof val == "object" && typeof val.toInteger == "function")
        this.operation("*=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        this.staticOperation("*=", val, conditional);
    else
        throw "Cannot multiplicate '" + val.constructor.name + "' with a Score";
};

Score.prototype.divide = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("/=", val.selector, val.scoreName, conditional);
    else if(typeof val == "object" && typeof val.toInteger == "function")
        this.operation("/=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        this.staticOperation("/=", val, conditional);
    else
        throw "Cannot divide Score through '" + val.constructor.name + "'";
};

Score.prototype.mod = function(val, conditional)
{
    if(val instanceof Score)
        this.operation("=", val.selector, val.scoreName, conditional);
    else if(typeof val == "object" && typeof val.toInteger == "function")
        this.operation("%=", val.toInteger().name, Integer.scoreName, conditional);
    else if(typeof val == "number")
        this.staticOperation("%=", val, conditional);
    else
        throw "Cannot divide Score through '" + val.constructor.name + "'";
};

Score.prototype.operation = function(op, otherName, otherScore, conditional)
{
    command(["scoreboard players operation", this.selector, this.scoreName, op, otherName, otherScore].join(" "), conditional);
};

Score.prototype.staticOperation = function(op, val, conditional)
{
    if(Integer.statics.indexOf(val) == -1)
        Integer.statics.push(val);
    this.operation(op, "static" + val.toString(), Integer.scoreName, conditional);
};

Score.prototype.toInteger = function(name)
{
    var val = new Integer(undefined, name);
    val.operation("=", this.selector, this.scoreName);
    return val;
};

Score.prototype.clone = function(cloneName)
{
    return this.toInteger(cloneName);
};

Score.prototype.toTellrawExtra = function()
{
    var val = this.toInteger();
    return val.toTellrawExtra();
};

Score.prototype.isExact = function(val)
{
    return this.isBetween(val, val);
};

Score.prototype.isBetweenEx = function(min, max)
{
    return this.isBetween(min + 1 || min, max - 1 || max);
};

Score.prototype.isBetween = function(min, max)
{
    min = typeof min == "number" ? min : -1 * Math.pow(2, 31);
    max = typeof max == "number" ? max : Math.pow(2, 31) - 1;

    return ["scoreboard players test", this.selector, this.scoreName, min, max].join(" ");
};

module.exports = Score;
