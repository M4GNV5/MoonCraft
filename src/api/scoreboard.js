cplApi.scoreboard = {};

cplApi.scoreboard.objective = function(name, type, displayName)
{
	type = type || "dummy";
	return new Scoreboard.Objective(new Scoreboard.ObjectiveType(type), name, displayName);
};
cplApi.scoreboard.score = function(objective, sel)
{
	if(objective instanceof Scoreboard.Objective)
		return new Scoreboard.Score(objective, sel);
	else
		return new Scoreboard.Score(cplApi.objective(objective.toString()), sel);
};

cplApi.scoreboard.display = {};
cplApi.scoreboard.display.belowName = function(objective)
{
	if(typeof objective != 'undefined')
		objective.setDisplay(Scoreboard.DisplaySlot.belowName);
	else
		Scoreboard.Objective.clearDisplay(Scoreboard.DisplaySlot.belowName);
};
cplApi.scoreboard.display.sidebar = function(objective)
{
	if(typeof objective != 'undefined')
		objective.setDisplay(Scoreboard.DisplaySlot.sidebar);
	else
		Scoreboard.Objective.clearDisplay(Scoreboard.DisplaySlot.sidebar);
};
cplApi.scoreboard.display.list = function(objective)
{
	if(typeof objective != 'undefined')
		objective.setDisplay(Scoreboard.DisplaySlot.list);
	else
		Scoreboard.Objective.clearDisplay(Scoreboard.DisplaySlot.list);
};



cplApi.scoreboard.team = function(name, displayName)
{
	var _team = new Scoreboard.Team(name, displayName);
	_team.setOption = function(option, value)
	{
		function err(message)
		{
			throw message;
		}

		if(option == "firendlyFire" || option == "seeFriendlyInvisibles")
			value = value === true ? true : false;
		else if(option == "color")
			value = Chat.Color[value] || err("Invalid color: {0}".format(value));
		else if(option == "nametagVisibility" || option == "deathMessageVisibility")
			value = Scoreboard.Visibility[value] || err("Invalid visibility: {0}".format(value));
		else
			throw "invalid team option: {0}".format(option);

		this[option] = value;
	};

	return _team;
};
