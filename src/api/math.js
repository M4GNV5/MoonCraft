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

//math functions from Util.math
cplApi.math.pow = function(base, exponent)
{
	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.pow(base, exponent, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.sin = function(value)
{
	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.sin(value, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.sqrt = function(value)
{
	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.sqrt(value, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.factorial = function(value)
{
	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.factorial(value, result, next.func);

	next.goNext();
	return result;
}
