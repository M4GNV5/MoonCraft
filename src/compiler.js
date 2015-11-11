var base = require("./lib/base.js");
var types = require("./lib/types.js");
var nextName = require("./lib/naming.js");
var Scope = require("./lib/scope.js");
var scope = new Scope();

module.exports = function(ast, output)
{
    for(var i = 0; i < ast.body.length; i++)
    {
        compileStatement(ast.body[i]);
    }
    base.output(output);
}

function throwError(message, loc)
{
    var locStr = " at line ";
    if(loc.start.line == loc.end.line)
        locStr += loc.start.line + " column " + loc.start.column;
    else
        locStr += loc.start.line + " column " + loc.start.column + " to line " + loc.end.line + " column " + loc.end.column;

    throw message + locStr;
}

function compileStatementList(body)
{
    var label = nextName("stmtList");
    base.addFunction(label, function()
    {
        scope.increase();
        for(var i = 0; i < body.length; i++)
        {
            compileStatement(body[i]);
        }
        scope.decrease();
    });
    return label;
}

function compileStatement(stmt)
{
    var type = stmt.type;

    if(!statements.hasOwnProperty(type))
        throwError("unknown statement type " + type, stmt.loc);

    return statements[type](stmt);
}

function compileExpression(expr)
{
    var type = expr.type;

    if(!expressions.hasOwnProperty(type))
        throwError("unknown expression type " + type, expr.loc);

    return expressions[type](expr);
}

function checkTypeMismatch(left, right, loc)
{
    var compatibleTypes = [
		[types.Boolean, (true).constructor], //bool
		[types.Integer, types.Float, (0).constructor], //int, float
		[types.String, ("").constructor] //string
	]

	if(left.constructor == right.constructor)
		return;

	for(var i = 0; i < compatibleTypes.length; i++)
	{
		if(compatibleTypes[i].indexOf(left.constructor) != -1 && compatibleTypes[i].indexOf(right.constructor) != -1)
		{
			return;
		}
	}

	throwError("Incompatible types " + a.constructor.name + " and " + b.constructor.name, loc);
}

function checkOperator(val, op, opLabel, loc)
{
    if(typeof val[op] != "function")
        throwError("Type " + val.constructor.name + " does not support operator " + opLabel, loc);
}

var statements = {};
var expressions = {};

statements["AssignmentStatement"] = function(stmt)
{
    if(stmt.variables.length != 1 || stmt.variables[0].type != "Identifier")
        throwError("unsupported left hand side expression", stmt.loc);
    if(stmt.init.length != 1)
        throwError("unsupported right hand side expression", stmt.loc);

    var key = stmt.variables[0].name;

    var oldVal = scope.get(key);
    var newVal = compileExpression(stmt.init[0]);

    if(!oldVal)
    {
        var name = nextName(key);

        if(typeof newVal == "boolean" || newVal.constructor == types.Boolean)
            oldVal = new types.Boolean(newVal, name);
        else if((typeof newVal == "number" && parseInt(newVal) == newVal) || newVal.constructor == types.Integer)
            oldVal = new types.Integer(newVal, name);
        else if(typeof newVal == "number" || newVal.constructor == types.Float)
            oldVal = new types.Float(newVal, name);
        else if(typeof newVal == "boolean" || newVal.constructor == types.String)
            oldVal = new types.String(newVal, name);

        scope.set(key, oldVal);
    }
    else
    {
        oldVal.set(newVal);
    }
}

statements["IfStatement"] = function(stmt)
{
    var clauses = stmt.clauses;

    var ifLabel = nextName("if");
    for(var i = 0; i < clauses.length; i++)
    {
        if(clauses[i].type == "IfClause")
        {
            compileExpression(clauses[i].condition);
            base.addLabelAt(ifLabel, -1);

            var bodyLabel = compileStatementList(clauses[i].body);
            base.jump(bodyLabel, true);
        }
        else if(type == "ElseifClause")
        {
            compileExpression(clauses[i].condition);
            command("testforblock %" + ifLabel + "%:diff minecraft:chain_command_block -1 {SuccessCount:0}", true);

            var bodyLabel = compileStatementList(clauses[i].body);
            base.jump(bodyLabel, true);
        }
        else if(type == "ElseClause")
        {
            command("testforblock %" + ifLabel + "%:diff minecraft:chain_command_block -1 {SuccessCount:0}", true);

            var bodyLabel = compileStatementList(clauses[i].body);
            base.jump(bodyLabel, true);
        }
        else
        {
            throwError("unsupported clause " + clauses[i].type, stmt.loc);
        }
    }
}

expressions["NumericLiteral"] = function(expr)
{
    return expr.value;
}

expressions["Identifier"] = function(expr)
{
    var val = scope.get(expr.name);
    if(!val)
        throwError("use of undefined variable " + expr.name, expr.loc);
    return val;
}

expressions["BinaryExpression"] = function(expr)
{
    var left = compileExpression(expr.left);
    var right = compileExpression(expr.right);
    var operator = expr.operator;

    checkTypeMismatch(left, right, expr.loc);

    var compileTimeOps = {
        "+": function(a, b) { return a + b; },
        "-": function(a, b) { return a - b; },
        "*": function(a, b) { return a * b; },
        "/": function(a, b) { return a / b; },
        "%": function(a, b) { return a % b; },
        "==": function(a, b) { return a == b; },
        "!=": function(a, b) { return a != b; },
        ">": function(a, b) { return a > b; },
        "<": function(a, b) { return a < b; },
        ">=": function(a, b) { return a >= b; },
        "<=": function(a, b) { return a <= b; }
    };

    var runtimeOps = {
        "+": "add",
        "-": "remove",
        "*": "multiplicate",
        "/": "divide",
        "%": "mod",
        "==": function(a, b)
        {
            checkOperator(a, "isExact", operator, expr.loc);
            a.isExact(b);
        },
        ">": function(a, b)
        {
            checkOperator(a, "isBetweenEx", operator, expr.loc);
            a.isBetweenEx(undefined, b);
        },
        "<": function(a, b)
        {
            checkOperator(a, "isBetweenEx", operator, expr.loc);
            a.isBetweenEx(b, undefined);
        },
        ">=": function(a, b)
        {
            checkOperator(a, "isBetween", operator, expr.loc);
            a.isBetween(undefined, b);
        },
        "<=": function(a, b)
        {
            checkOperator(a, "isBetween", operator, expr.loc);
            a.isBetween(b, undefined);
        },
        "!=": function(a, b)
        {
            checkOperator(a, "isExact", operator, expr.loc);
            a.isExact(b);
            command("testforblock %-1:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
        }
    }

    if(typeof left != "object" && typeof right != "object")
    {
        return compileTimeOps[operator](left, right);
    }
    else if(typeof left == "object" && typeof right == "object")
    {
        var op = runtimeOps[operator];

        checkOperator(left, "clone", "clone", expr.loc);
        var clone = left.clone();

        if(typeof op == "string")
        {
            checkOperator(clone, op, operator, expr.loc);
            clone[op](right);
        }
        else
        {
            checkOperator(left, "remove", "-", expr.loc);
            clone.remove(right);
            op(clone, 0);
        }
        return clone;
    }
    else
    {
        var _left = typeof left == "object" ? left : right;
        var _right = typeof right == "object" ? left : right;

        checkOperator(_left, "clone", "clone", expr.loc);
        var clone = _left.clone();

        var op = runtimeOps[operator];
        if(typeof op == "string")
        {
            checkOperator(clone, op, operator, expr.loc);
            clone[op](_right);
        }
        else
        {
            op(clone, _right);
        }

        return clone;
    }
}
