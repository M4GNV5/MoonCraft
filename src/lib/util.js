var base = require("./base.js");
var types = require("./types.js");

String.prototype.format = function()
{
	var val = this;
	for(var i = 0; i < arguments.length; i++)
		val = val.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i].toString());
	return val;
}

module.exports = (function(vars, functions)
{
	this.checkOperator = function(obj, member, operator, line)
	{
		var type = obj.constructor.name;

		this.assert(typeof obj[member] != 'undefined', "Object of type '{0}' does not support operator '{1}' at line {2} column {3} to {4}"
			.format(type, operator, line.first_line, line.first_column, line.last_column));
	}

	this.checkUndefined = function(name, line, checkFunctions)
	{
		checkFunctions = checkFunctions || false;

		this.assert(vars[name] || (functions[name] && checkFunctions), "Unknown identifier '{0}' at line {1} column {2} to {3}"
			.format(name, line.first_line, line.first_column, line.last_column));
	}

	this.checkDefined = function(name, line)
	{
		this.assert(typeof vars[name] == 'undefined', "Variable with name {0} already exists at line {1} column {2} to {3}"
			.format(name, line.first_line, line.first_column, line.last_column));
	}

	this.typeMismatch = function(left, right)
	{
		var compatibleTypes = [
			[types.Boolean, (true).constructor], //bool
			[types.Integer, (0).constructor], //int, float
			[types.String, ("").constructor] //string
		]

		if(left.constructor == right.constructor)
			return false;

		for(var i = 0; i < compatibleTypes.length; i++)
		{
			if(compatibleTypes[i].indexOf(left.constructor) != -1 && compatibleTypes[i].indexOf(right.constructor) != -1)
			{
				return false;
			}
		}

		return true;
	}

	this.assert = function(test, message)
	{
		if(!test)
			throw message;
	}

	var lastNames = {};
	this.nextName = function(name)
	{
		lastNames[name] = lastNames[name] + 1 || 0;
		return name + lastNames[name];
	}
});
