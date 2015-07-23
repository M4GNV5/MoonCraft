function createStaticVar(value, name)
{
	var type = typeof value;
	value = new Object(value);
	value.type = type;

	function _set(val)
	{
		vars[name] = createStaticVar(val, name);
	}

	value.set = function(val)
	{
		_set(val);
	}

	value.toTellrawExtra = function()
	{
		var val;
		if(value.type == 'object')
			val = JSON.stringify(value);
		else
			val = value.toString();

		return new Chat.Message(val);
	}

	value.isExact = function(val, callback)
	{
		var cmd;
		if(vars[name] == val)
		{
			cmd = new MinecraftCommand("tetsfor @e");
			cmd.result = true;
		}
		else
		{
			cmd = new MinecraftCommand("{0} == {1} is false".format(vars[name], val));
			cmd.result = false;
		}

		if(typeof callback != 'undefined')
			cmd.validate(callback);

		return cmd;
	}

	if(value.type == 'string' || value.type == 'number')
	{
		value.add = function(val)
		{
			_set(vars[name] + val);
		}
	}

	if(value.type == 'number')
	{
		value.remove = function(val)
		{
			_set(vars[name] - val);
		}
		value.multiplicate = function(val)
		{
			_set(vars[name] * val);
		}
		value.divide = function(val)
		{
			_set(vars[name] / val);
		}

		value.toInteger = function()
		{
			var val = parseInt(vars[name]);
			return new Runtime.Integer(val, "const" + val);
		}
		value.isBetween = function(min, max, callback)
		{
			if(typeof min == 'undefined')
				min = -2147483648;
			if(typeof max == 'undefined')
				max = 2147483648;

			var cmd;
			if(vars[name] >= min && vars[name] <= max)
			{
				cmd = new MinecraftCommand("tetsfor @e");
				cmd.result = true;
			}
			else
			{
				cmd = new MinecraftCommand("{0} <= {1} <= {2} is false".format(min, vars[name].toString(), max));
				cmd.result = false;
			}

			if(typeof callback != 'undefined')
				cmd.validate(callback);

			return cmd;
		}
	}

	return value;
}
