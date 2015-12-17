exports.query_time_static = function(val, query)
{
    var scoreName = val.constructor.scoreName;
    var selector = "@e[type=ArmorStand,name=time_query]";
    command("summon ArmorStand ~ ~ ~ {CustomName:\"time_query\",NoGravity:true}");
    command("scoreboard players set {0} {1} -1".format(selector, scoreName));
    command("stats entity {0} set QueryResult {0} {1}".format(selector, scoreName));
    command("execute {0} ~ ~ ~ time query {1}".format(selector, query));
    command("scoreboard players operation {0} {2} = {1} {2}".format(val.name, selector, scoreName));
    command("kill {0}".format(selector));
};
