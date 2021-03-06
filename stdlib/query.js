var scoreName = scope.get("OBJECTIVE_NAME");

exports.query = function(val, kind, cmd)
{
    var selector = "@e[type=ArmorStand,tag=query]";
    command("summon ArmorStand ~ ~ ~ {Tags:[\"query\"],NoGravity:true}");
    command("scoreboard players set {0} {1} -1".format(selector, scoreName));
    command("stats block %1:diff% set {1} {0} {2}".format(selector, kind, scoreName));
    command(cmd);
    command("scoreboard players operation {0} {2} = {1} {2}".format(val.name, selector, scoreName));
    command("kill {0}".format(selector));
};
