cplApi.Block = Block;
cplApi.Chat = Chat;
cplApi.Entities = Entities;
cplApi.Players = Players;
cplApi.Runtime = Runtime;
cplApi.Scoreboard = Scoreboard;
cplApi.Util = Util;

cplApi.construct = function()
{
	var args = [];
	for(var i = 1; i < arguments.length; i++)
		args.push(arguments[i]);

	function _construct(constructor, ctorArgs)
	{
	    function ctor()
	    {
	        return constructor.apply(this, ctorArgs);
	    }
	    ctor.prototype = constructor.prototype;

	    return new ctor();
	}

	return _construct(arguments[0], args);
}
