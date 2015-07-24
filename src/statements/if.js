var ifStatement = function(comparation, body)
{
	this.default = function()
	{
		var next = startNewFunction();
		comparation().validate(function()
		{
			body();
			call(next.func);
		}, next.func);
		next.goNext();
	};

	this.async = function()
	{
		comparation().validate(function() { body(); });
	};

	this.static = function()
	{
		if(comparation().result)
		{
			body();
		}
	};

	this.asyncstatic = function()
	{
		call(function()
		{
			this.static();
		});
	};
};

var ifElseStatement = function(comparation, body, elseBody)
{
	this.default = function()
	{
		var next = startNewFunction();
		comparation().validate(function()
		{
			body();
			call(next.func);
		}, function()
		{
			elseBody();
			call(next.func);
		});
		next.goNext();
	};

	this.async = function()
	{
		comparation().validate(body, elseBody);
	};

	this.static = function()
	{
		if(comparation().result)
		{
			body();
		}
		else
		{
			elseBody();
		}
	};

	this.asyncStatic = function()
	{
		var that = this;
		call(function()
		{
			that.static();
		});
	};
};
