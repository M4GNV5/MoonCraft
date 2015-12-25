var tellraw = scope.get("tellraw");
var chat_message = scope.get("chat_message");
var chat_event = scope.get("chat_event");

var scoreName = scope.get("OBJECTIVE_NAME");
var tmpScoreName = "MoonCraftTmp";

var debug_break = scope.get("debug_break");
var debug_backtrace = scope.get("debug_backtrace");

exports.debug = function()
{
    exports.debug_variables();
    tellraw("");

    debug_backtrace();
    tellraw("");

    debug_break();
}

exports.debug_variables = function()
{
    maxCount = 100;
    var stack = scope.stack;
    var changeSupports = ["Integer", "Float", "Boolean", "Score"];

    for(var i = stack.length - 1; i >= 0 && maxCount > 0; i--)
    {
        var curr = stack[i];
        for(var key in curr)
        {
            if(key[0] == "." || typeof curr[key] == "function")
                continue;

            var val = curr[key];


            var change = "";
            if(changeSupports.indexOf(val.constructor.name) != -1)
            {
                var sel = val.name || val.selector;
                var objective = val.scoreName || scoreName;

                var ev = chat_event("suggest_command", "/scoreboard players set {0} {1} ".format(sel, objective));
                change = chat_message(" [change]", "blue", false, ev);
            }

            var typeStr = typeof val == "object" ? val.constructor.name : typeof val;

            var type = chat_message(typeStr[0], false, false, false, chat_event("show_text", typeStr));

            if(typeStr[0] == "I") //align and stuff
                tellraw(type, chat_message(".", "dark_gray"), chat_message(" : ", "green"), key, chat_message(" = ", "red"), curr[key], change);
            else
                tellraw(type, chat_message(" : ", "green"), key, chat_message(" = ", "red"), curr[key], change);

            maxCount--;
            if(maxCount == 0)
                break;
        }
    }
}

exports.debug_stackcount = function(val)
{
    var selfSel = "@e[type=ArmorStand,c=1,r=0,tag=stack]";
    command("execute @e[type=ArmorStand,tag=stack] ~ ~ ~ scoreboard players operation {0} {1} > {2} {3}"
        .format(val.name, scoreName, selfSel, scoreName));
}

exports.debug_select_stack = function(index)
{
    var sel = "@e[type=ArmorStand,tag=stack]";
    var selfSel = "@e[type=ArmorStand,c=1,r=0,tag=stack]";
    command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} = {1} {3}".format(sel, selfSel, tmpScoreName, scoreName));
    command("execute {0} ~ ~ ~ scoreboard players operation {1} {2} -= {3} {4}".format(sel, selfSel, tmpScoreName, index.name, scoreName));

    var _sel = "@e[type=ArmorStand,tag=stack,score_{0}_min=0,score_{0}=0]".format(tmpScoreName);
    return {selector: _sel};
}
