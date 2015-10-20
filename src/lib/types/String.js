var naming = require("./../naming.js");

var nextId = 1;

function String(startVal, name)
{
    this.name = name || naming.next("string");
    startVal = startVal || "";
    var _startVal = startVal.toString() || name;

    command("summon ArmorStand ~ ~1 ~ {NoGravity:1,CustomName:\"{0}\"}".format(_startVal));

    command("scoreboard players set @e[type=ArmorStand] cplVars {0} {CustomName:\"{1}\"}".format(nextId, _startVal));
    this.selector = "@e[type=ArmorStand,score_cplVars_min={0},score_cplVars={0}]".format(nextId);
    nextId++;

    if(_startVal == name)
        this.set(startVal.toString());
}

String.prototype.set = function(val)
{
    if(typeof val == "string")
        command("entitydata {0} {CustomName:\"{1}\"}".format(this.selector, val.toString()));
    else
        throw "Cannot assing '" + val.constructor.name + "' to a Boolean";
}

String.prototype.toTellrawExtra = function()
{
    return {selector: this.selector};
}

String.prototype.isExact = function(val)
{
    return "testfor {0} {CustomName:\"{1}\"}".format(this.selector, val);
}

module.exports = String;
