cplApi.objective = function(name, type, displayName)
{
	type = type || "dummy";
	return new Scoreboard.Objective(new Scoreboard.ObjectiveType(type), name, displayName);
}
cplApi.score = function(objective, sel)
{
	if(objective instanceof Scoreboard.Objective)
		return new Scoreboard.Score(objective, sel);
	else
		return new Scoreboard.Score(cplApi.objective(objective.toString()), sel);
}

cplApi.display = {};
cplApi.display.belowName = function(objective)
{
	objective.setDisplay(Scoreboard.DisplaySlot.belowName);
}
cplApi.display.sidebar = function(objective)
{
	objective.setDisplay(Scoreboard.DisplaySlot.sidebar);
}
cplApi.display.list = function(objective)
{
	objective.setDisplay(Scoreboard.DisplaySlot.list);
}
