var whileStatement = function(comparation, body, checkAtStart)
{
	this.default = function()
	{
		var next = startNewFunction();
		var repeat = function()
		{
			body();
			comparation().validate(repeat, next.func);
		}

		if(checkAtStart)
			comparation().validate(repeat, next.func);
		else
			call(repeat);

		next.goNext();
	};

	this.async = function()
	{
		var repeat = function()
		{
			body();
			comparation().validate(repeat);
		}

		if(checkAtStart)
			comparation().validate(repeat);
		else
			call(repeat);
	};

	this.static = function()
	{
		if(checkAtStart)
		{
			while(comparation().result)
			{
				body();
			}
		}
		else
		{
			do
			{
				body();
			} while(comparation().result);
		}
	};

	this.asyncstatic = function()
	{
		var that = this;
		call(function()
		{
			that.static();
		});
	};
};
