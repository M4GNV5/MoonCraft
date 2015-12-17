var nextName = require("./../lib/naming.js");
var scope = require("./../lib/Scope.js");
var Integer = require("./Integer.js");

var nextId = 1;

function String(startVal, name)
{
    this.name = name || nextName("string");
    startVal = startVal || "";
    var _startVal = startVal.toString() || name;

    this.selector = "@e[type=ArmorStand,score_{0}_min={1},score_{0}={1}]".format(Integer.scoreName, nextId);

    command("kill {0}".format(this.selector));
    command("summon ArmorStand ~ ~1 ~ {NoGravity:1,CustomName:\"{0}\"}".format(this.name));

    command("scoreboard players set @e[type=ArmorStand] {0} {1} {CustomName:\"{2}\"}".format(Integer.scoreName, nextId, this.name));
    nextId++;

    this.set(startVal.toString());

    //set invisible variable for garbage collector
    scope.set("." + this.name, this);
}

String.prototype.set = function(val, conditional)
{
    if(typeof val == "string")
        command("entitydata {0} {CustomName:\"{1}\"}".format(this.selector, val.toString()), conditional);
    else
        throw "Cannot assing '" + val.constructor.name + "' to a Boolean";
};

String.prototype.clean = function()
{
    command("kill {0}".format(this.selector));
};

String.prototype.toTellrawExtra = function()
{
    return JSON.stringify({selector: this.selector});
};

String.prototype.isExact = function(val)
{
    return "testfor {0} {CustomName:\"{1}\"}".format(this.selector, val);
};

module.exports = String;
