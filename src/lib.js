var cplApi = cplApi || {};
var vars =  vars || {};
var functions = functions || {};
var ctors = ctors || {};

function checkOperator(obj, member, operator, line)
{
	var type = obj.constructor.name;

	Util.assert(typeof obj[member] != 'undefined', "Object of type '{0}' does not support operator '{1}' at line {2} column {3} to {4}"
		.format(type, operator, line.first_line, line.first_column, line.last_column));
}

function checkUndefined(name, line, checkFunctions)
{
	checkFunctions = checkFunctions || false;

	Util.assert(vars[name] || (functions[name] && checkFunctions), "Unknown identifier '{0}' at line {1} column {2} to {3}"
		.format(name, line.first_line, line.first_column, line.last_column));
}

function checkDefined(name, line)
{
	Util.assert(typeof vars[name] == 'undefined', "Variable with name {0} already exists at line {1} column {2} to {3}"
		.format(name, line.first_line, line.first_column, line.last_column));
}

function typeMismatch(left, right)
{
	var numberTypes = [Runtime.Integer, Runtime.Decimal, Scoreboard.Score, (0).constructor];

	if(left.constructor == right.constructor)
		return false;
	else if(left instanceof Runtime.Boolean && typeof right == 'boolean')
		return false;
	else if(numberTypes.indexOf(left.constructor) !== -1 && numberTypes.indexOf(right.constructor) !== -1)
		return false;
	else if(left instanceof Runtime.String && typeof right == 'string')
		return false;
	else if(left instanceof Runtime.Callback && typeof right == 'function')
		return false;
	else if(left instanceof StaticVariable)
		return false;
	else
		return true;
}

function checkModifiers(modifier, allowed, label, line)
{
	for(var i = 0; i < modifier.length; i++)
	{
		if(allowed.indexOf(modifier[i]) === -1)
			throw "Modifier {0} is not allowed for {1} in line {2} column {3} to {4}".format(modifier[i], label, line.first_line, line.first_column, line.last_column);
	}
}

function runModifiedStatement(stmt, modifier)
{
	var mode;
	if(modifier.length > 0)
	{
		mode = "";
		for(var i = 0; i < modifier.length; i++)
		{
			mode += modifier[i];
		}
	}
	else
	{
		mode = "default";
	}

	stmt[mode]();
}

var needsHelperCommands = [];
function startNewFunction()
{
	var val = {};

	val.func = function() {};
	outputHandler.functions.push(val.func);
	var id = outputHandler.functions.indexOf(val.func);
	outputHandler.output[id] = new Output.CbjsFunction();

	val.goNext = function()
	{
		needsHelperCommands.push(id);
		
		outputHandler.current = id;
	};

	return val;
}
