var Integer = require("./Integer.js");
var Score = require("./Score.js");
var nextName = require("./../lib/naming.js");

function Table(val, name)
{
    this.name = name || nextName("table");

    var lengthProperty = {
        get: function()
        {
            var val = new Integer();
            val.isClone = true;
            command("execute @e[type=ArmorStand,tag={0}] ~ ~ ~ scoreboard players add {1} {2} 1"
                .format(this.name, val.name, Integer.scoreName));
            return val;
        }
    };

    Object.defineProperty(this, "length", lengthProperty);

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

    if(val)
        this.set(val);
}

Table.scoreName = Integer.scoreName;
Table.indexScoreName = "MoonCraftTable";
Table.tmpScoreName = "MoonCraftTmp";

Table.prototype.set = function(val)
{
    if(val instanceof Table)
    {
        command("scoreboard players tag @e[type=ArmorStand,tag={0}] add {1}".format(val.name, this.name));
    }
    else if(val instanceof Array)
    {
        command("kill @e[type=ArmorStand,tag={0}]".format(this.name));

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

Table.prototype.setAt = function(index, val)
{
    var score = this.getScoreAt(index);
    command("testfor " + score.selector);
    command("testforblock %-1:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
    command("summon ArmorStand %1:jmp% {NoGravity:true,Tags:[\"tableTmp\"]}".format(this.name), true);

    var sel = "@e[type=ArmorStand,tag=tableTmp]";
    if(typeof index == "number")
    {
        var indexScore = new Score(sel, Table.indexScoreName);
        indexScore.set(index, true);
    }
    else
    {
        var tmpScore = new Score(sel, Table.tmpScoreName);
        tmpScore.set(0, true);
        var indexScore = new Score(sel, Table.indexScoreName);
        indexScore.set(index);
    }

    command("entitydata {0} {Tags:[\"{1}\"]}".format(sel, this.name));
    score.set(val);
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
        throw "Cannot get value from a Table using an index of type '" + val.constructor.name + "'";
    }
}

module.exports = Table;
