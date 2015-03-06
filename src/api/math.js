var lastRandom;
cplApi.random = function()
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
cplApi.randomSeed = function(value)
{
	if(typeof value != 'undefined')
		lastRandom.set(value);

	return lastRandom;
}

cplApi.intMax = function()
{
	return Math.pow(2, 31) - 1;
}
cplApi.intMin = function()
{
	return -Math.pow(2, 31);
}

cplApi.pi = function()
{
    return 3.14;
}

cplApi.euler = function()
{
    return 2.72;
}
