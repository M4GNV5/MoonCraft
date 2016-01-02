var Integer = require("./Integer.js");
var Score = require("./Score.js");
var nextName = require("./../lib/naming.js");

function Table(val, name, silent)
{
    this.name = name || nextName("table");

    Table.used = true;

    Object.defineProperty(this, "length", {
        get: function()
        {
            var val = new Integer();
            val.isClone = true;
            command("execute @e[type=ArmorStand,tag={0}] ~ ~ ~ scoreboard players add {1} {2} 1"
                .format(this.name, val.name, Integer.scoreName));
            return val;
        }
    });

    Object.defineProperty(this, "maxn", {
        get: function()
        {
            var val = new Integer();
            val.isClone = true;
            var selfSel = "@e[type=ArmorStand,c=1,r=0,tag={0}]".format(table.name);

            command("execute @e[type=ArmorStand,tag={0}] ~ ~ ~ scoreboard players operation {1} {2} > {3} {4}"
                .format(table.name, val.name, Integer.scoreName, selfSel, Table.indexScoreName));
            return val;
        }
    });

    if(val && !silent)
        this.set(val);
}

Table.scoreName = Integer.scoreName;
Table.used = false;
Table.indexScoreName = "MoonCraftTable";
Table.tmpScoreName = "MoonCraftTmp";

Table.prototype.set = function(val)
{
    this.clean();

    if(val instanceof Table)
    {
        //super non hacky fix for table armorstands at same position
        command("spreadplayers ~ ~ 1 50 false @e[tag={0}]".format(val.name));

        var otherSel = "@e[type=ArmorStand,tag={0}]".format(val.name);
        var selfSel = "@e[type=ArmorStand,r=0,tag={0}]".format(val.name);
        var newSel = "@e[type=ArmorStand,tag=tableTmp,r=0]";

        command("execute {0} ~ ~ ~ summon ArmorStand ~ ~ ~ {NoGravity:true,Tags:[\"tableTmp\"]}".format(otherSel));
        command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} = {3} {2}".format(otherSel, newSel, Table.indexScoreName, selfSel));
        command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} = {3} {2}".format(otherSel, newSel, Table.scoreName, selfSel));
        command("entitydata @e[type=ArmorStand,tag=tableTmp] {Tags:[\"{0}\"]}".format(this.name));
    }
    else if(val instanceof Array)
    {
        var sel = "@e[type=ArmorStand,tag=tableTmp,c=1]";
        var score = new Score(sel, Table.scoreName);
        var index = new Score(sel, Table.indexScoreName);

        for(var i = 0; i < val.length; i++)
        {
            if(typeof val[i] == "object" && typeof val[i].toInteger != "function")
                throw "Cannot assing '" + val[i].constructor.name + "' to a Table";

            var _val = typeof val[i] == "object" ? val[i].toInteger() : val[i];

            command("summon ArmorStand ~ ~1 ~ {NoGravity:true,Tags:[\"tableTmp\"]}");
            score.set(_val);
            index.set(i + 1);

            command("entitydata {0} {Tags:[\"{1}\"]}".format(sel, this.name));
        }
    }
    else
    {
        throw "Cannot assing '" + val.constructor.name + "' to a Table";
    }
}

Table.prototype.clean = function()
{
    command("kill @e[type=ArmorStand,tag={0}]".format(this.name));
}

Table.prototype.insert = function(index, val)
{
    this.getScoreAt(index);

    if(typeof index == "number")
    {
        command("scoreboard players add @e[type=ArmorStand,tag={0},score_{1}_min={2}] {1} 1"
            .format(this.name, Table.indexScoreName, index));
    }
    else if(typeof index.toInteger == "function")
    {
        command("scoreboard players add @e[type=ArmorStand,tag={0},score_{1}_min=0] {2} 1"
            .format(this.name, Table.tmpScoreName, Table.indexScoreName));
    }

    var sel = "@e[type=ArmorStand,tag=tableTmp,c=1]";
    var score = new Score(sel, Table.scoreName);
    var _index = new Score(sel, Table.indexScoreName);

    command("summon ArmorStand ~ ~1 ~ {NoGravity:true,Tags:[\"tableTmp\"]}");
    score.set(val);
    _index.set(index);
    command("entitydata {0} {Tags:[\"{1}\"]}".format(sel, this.name));
}

Table.prototype.remove = function(index)
{
    var sel = this.getScoreAt(index).selector;
    command("kill " + sel);

    if(typeof index == "number")
    {
        command("scoreboard players remove @e[type=ArmorStand,tag={0},score_{1}_min={2}] {1} 1"
            .format(this.name, Table.indexScoreName, index));
    }
    else if(typeof index.toInteger == "function")
    {
        command("scoreboard players remove @e[type=ArmorStand,tag={0},score_{1}_min=0] {2} 1"
            .format(this.name, Table.tmpScoreName, Table.indexScoreName));
    }
}

Table.prototype.slice = function(start, end)
{
    if(typeof start == "number")
    {
        start = start - 1;
        command("kill @e[type=ArmorStand,tag={0},score_{1}={2}]".format(this.name, Table.indexScoreName, start));
        var index = new Score("@e[type=ArmorStand,tag={0}]".format(this.name), Table.indexScoreName);
        index.remove(start);

        if(typeof end == "number")
            end = end - start;
        else if(typeof (end || {}).toInteger == "function")
            end.remove(start);
    }
    else if(typeof start.toInteger == "function")
    {
        start = start.toInteger();
        start.remove(1);

        var sel = "@e[type=ArmorStand,tag={0}]".format(this.name);
        var selfSel = "@e[type=ArmorStand,c=1,r=0,tag={0}]".format(this.name);
        command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} -= {3} {4}".format(sel, selfSel, Table.indexScoreName, start.name, Integer.scoreName));
        command("kill @e[type=ArmorStand,tag={0},score_{1}=0]".format(this.name, Table.indexScoreName));

        if(typeof end == "number")
            end = new Integer(end);

        if(typeof (end || {}).toInteger == "function")
            end.remove(start);
    }

    if(typeof end == "number")
    {
        command("kill @e[type=ArmorStand,tag={0},score_{1}_min={2}]".format(this.name, Table.indexScoreName, end + 1));
    }
    else if(typeof (end || {}).toInteger == "function")
    {
        this.getScoreAt(end);
        command("kill @e[type=ArmorStand,tag={0},score_{1}_min=1]".format(this.name, Table.tmpScoreName));
    }
}

Table.prototype.setAt = function(index, val)
{
    var score = this.getScoreAt(index);
    command("kill " + score.selector);

    command("summon ArmorStand %1:jmp% {NoGravity:true,Tags:[\"tableTmp\"]}".format(this.name));
    var sel = "@e[type=ArmorStand,tag=tableTmp]";
    if(typeof index == "number")
    {
        var indexScore = new Score(sel, Table.indexScoreName);
        indexScore.set(index);
    }
    else
    {
        var indexScore = new Score(sel, Table.indexScoreName);
        indexScore.set(index);
    }

    var valScore = new Score(sel, Table.scoreName);
    valScore.set(val);

    command("entitydata {0} {Tags:[\"{1}\"]}".format(sel, this.name));
}

Table.prototype.get = function(index)
{
    var score = this.getScoreAt(index);
    var val = score.toInteger();
    val.isClone = true;
    return val;
}

Table.prototype.getScoreAt = function(index)
{
    if(typeof index == "number")
    {
        var sel = "@e[type=ArmorStand,tag={0},score_{1}_min={2},score_{1}={2}]".format(this.name, Table.indexScoreName, index);
        return new Score(sel, Table.scoreName);
    }
    else if(typeof index.toInteger == "function")
    {
        index = index.toInteger();
        var sel = "@e[type=ArmorStand,tag={0}]".format(this.name);
        var selfSel = "@e[type=ArmorStand,c=1,r=0,tag={0}]".format(this.name);
        command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} = {1} {3}".format(sel, selfSel, Table.tmpScoreName, Table.indexScoreName));
        command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} -= {3} {4}".format(sel, selfSel, Table.tmpScoreName, index.name, Integer.scoreName));

        var valSel = "@e[type=ArmorStand,tag={0},score_{1}_min=0,score_{1}=0]".format(this.name, Table.tmpScoreName);
        return new Score(valSel, Table.scoreName);
    }
    else
    {
        throw "Cannot get value from a Table using an index of type '" + index.constructor.name + "'";
    }
}

Table.prototype.toTellrawExtra = function()
{
    var len = this.length.toTellrawExtra();
    return "\"table[\",{0},\"]\"".format(len);
}

module.exports = Table;
