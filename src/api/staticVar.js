function StaticVariable(value)
{
	this.value = value;

	this.set = function(val)
	{
		this.value = val;
	}

	this.add = function(val)
	{
		this.value += val;
	}
	this.remove = function(val)
	{
		this.value -= val;
	}
	this.multiplicate = function(val)
	{
		this.value *= val;
	}
	this.divide = function(val)
	{
		this.value /= val;
	}

	this.toString = function()
	{
		return this.value.toString();
	}
	this.toTellrawExtra = function()
	{
		var val;
		if(typeof this.value.toTellrawExtra == 'function')
			val = this.value.toTellrawExtra();
		else if(typeof this.value == 'object')
			val = JSON.stringify(this.value);
		else
			val = this.value.toString();

		return new Chat.Message(val);
	}

	this.isBetween = function(min, max, callback)
	{
		if(typeof min == 'undefined')
			min = -2147483648;
		if(typeof max == 'undefined')
			max = 2147483648;

		var cmd;
		if(this.value >= min && this.value <= max)
		{
			cmd = new MinecraftCommand("tetsfor @e");
			cmd.result = true;
		}
		else
		{
			cmd = new MinecraftCommand("{0} <= {1} <= {2} is false".format(min, this.value.toString(), max));
			cmd.result = false;
		}

		if(typeof callback != 'undefined')
			cmd.validate(callback);

		return cmd;
	}
	this.isExact = function(val, callback)
	{
		var cmd;
		if(this.value == val)
		{
			cmd = new MinecraftCommand("tetsfor @e");
			cmd.result = true;
		}
		else
		{
			cmd = new MinecraftCommand("{0} == {1} is false".format(this.value, val));
			cmd.result = false;
		}

		if(typeof callback != 'undefined')
			cmd.validate(callback);

		return cmd;
	}
}