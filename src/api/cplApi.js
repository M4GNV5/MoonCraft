var cpl = {};

cpl.setValue = function(name, value, forceVar)
{
	if(typeof value == 'function' && !forceVar)
		functions[name] = value;
	else
		vars[name] = value;
}

cpl.getValue = function(name, forceFunc)
{
	return forceFunc === true ? functions[name] : vars[name] || functions[name];
}

cpl.import = function(name)
{
	var split = name.split('.');

	var val = cplApi;
	for(var i = 0; i < split.length; i++)
	{
		if(split[i] == "*")
		{
			for(var _name in val)
			{
				if(val.hasOwnValue(_name))
				{
					cpl.import(name.replace("*", _name));
				}
			}
			return;
		}
		else
		{
			val = val[split[i]];
			if(typeof val == 'undefined')
				throw "Invalid import "+name;
		}
	}

	var outName = split[split.length - 1];
	vars[outName] = val;
}
cplApi.import = cpl.import;
functions.import = cpl.import;

cpl.require = function(name)
{
	var split = name.split('.');
	var val = cplApi[split[0]];
	for(var i = 1; i < split.length; i++)
		val = val[split[i]];

	return val;
}
cplApi.require = cpl.require;
functions.require = cpl.require;
