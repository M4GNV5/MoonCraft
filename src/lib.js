var cplApi = cplApi || {};
var vars =  vars || {};
var functions = functions || {};

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
	if(left.constructor == right.constructor)
		return false;
	else if(left instanceof Runtime.Boolean && typeof right == 'boolean')
		return false;
	else if(left instanceof Runtime.Integer && typeof right == 'number')
		return false;
	else if(left instanceof Runtime.Decimal && typeof right == 'number')
		return false;
	else if(left instanceof Runtime.String && typeof right == 'string')
		return false;
	else if(left instanceof Runtime.Callback && typeof right == 'function')
		return false
	else
		return true;
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
