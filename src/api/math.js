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
	var staticBase;
	if(typeof base == 'number')
		staticBase = base;
	else if(base.type == 'number')
		staticBase = base + 0;

	var staticExponent;
	if(typeof exponent == 'number')
		staticExponent = exponent;
	else if(exponent.type == 'number')
		staticExponent = exponent + 0;

	if(typeof staticBase == 'number' && typeof staticExponent == 'number')
		return Math.pow(staticBase, staticExponent);
	else if(typeof staticExponent == 'number')
		exponent = new Runtime.Integer(staticExponent);

	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.pow(base, exponent, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.sin = function(value)
{
	if(typeof value == 'number')
		return Math.sin(value);
	else if(value.type == 'number')
		return Math.sin(value + 0);

	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.sin(value, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.sqrt = function(value)
{
	if(typeof value == 'number')
		return Math.sqrt(value);
	else if(value.type == 'number')
		return Math.sqrt(value + 0);

	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.sqrt(value, result, next.func);

	next.goNext();
	return result;
}

cplApi.math.factorial = function(value)
{
	if(typeof value == 'number')
		return staticFactorial(value);
	else if(value.type == 'number')
		return staticFactorial(value + 0);

	var next = startNewFunction();
	var result = new Runtime.Decimal();

	Util.Math.factorial(value, result, next.func);

	next.goNext();
	return result;
}

function staticFactorial (n)
{
	if (n == 0 || n == 1)
		return 1;
	return staticFactorial(n - 1) * n;
}
