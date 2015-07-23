cplApi.Block = Block;
cplApi.Chat = Chat;
cplApi.Entities = Entities;
cplApi.Players = Players;
cplApi.Runtime = Runtime;
cplApi.Scoreboard = Scoreboard;
cplApi.Util = Util;
cplApi.MinecraftCommand = MinecraftCommand;

cplApi.construct = function()
{
	var other = arguments[0];
	if(other instanceof StaticVariable)
		other = other.value;

	var args = [];
	for(var i = 1; i < arguments.length; i++)
		args.push(arguments[i]);

	function ctor()
	{
		return other.apply(this, args);
	}
	ctor.prototype = other.prototype;

	return new ctor();
}

cplApi.array = function()
{
	var obj = [];
	obj.get = function(index)
	{
		return obj[index];
	}
	obj.set = function(index, value)
	{
		obj[index] = value;
	}
	return obj;
}
cplApi.object = function()
{
	var obj = {};
	obj.get = function(name)
	{
		return obj[name];
	}
	obj.set = function(name, value)
	{
		obj[name] = value;
	}
	obj.keys = function()
	{
		Object.keys(obj);
	}
	return obj;
}
