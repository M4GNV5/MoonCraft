var forStatement = function(init, comparation, assign, body)
{
	this.default = function()
	{
		var next = startNewFunction();
		init();
		var repeat = function()
		{
			body();
			assign();
			comparation().validate(repeat, next.func);
		}
		comparation().validate(repeat, next.func);
		next.goNext();
	};

	this.async = function()
	{
		init();
		var repeat = function()
		{
			body();
			assign();
			comparation().validate(repeat);
		}
		comparation().validate(repeat);
	};

	this.static = function()
	{
		init();
		while(comparation().result)
		{
			body();
			assign();
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
