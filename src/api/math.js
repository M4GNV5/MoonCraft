//random
cplApi.math = {};

var lastRandom;
cplApi.math.random = function()
{
	if(typeof lastRandom == 'undefined')
	{
		callOnce(function()
		{
			lastRandom = new Runtime.Integer(1, "randomSeed");
		});
	}

	lastRandom.multiplicate(214013);
	lastRandom.add(2531011);
	lastRandom.set(32768, Runtime.NumberSetMode.divisionRemainder);

	return lastRandom;
}
cplApi.math.randomSeed = function(value)
{
	if(typeof lastRandom == 'undefined')
	{
		callOnce(function()
		{
			lastRandom = new Runtime.Integer(1, "randomSeed");
		});
	}

	if(typeof value != 'undefined')
		lastRandom.set(value);

	return lastRandom;
}

//constants
cplApi.math.pi = function()
{
    return 3.14;
}
cplApi.math.euler = function()
{
    return 2.72;
}
