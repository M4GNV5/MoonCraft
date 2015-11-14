var base = require("./lib/base.js");
var types = require("./lib/types.js");
var nextName = require("./lib/naming.js");
var optimize = require("./lib/optimize.js");
var Scope = require("./lib/scope.js");
var scope = new Scope();

var fnReturn = new types[options.returnType](0, "retVal");

module.exports = function(ast, path, isMain)
{
    for(var i = 0; i < ast.body.length; i++)
    {
        if(ast.body[i].type == "FunctionDeclaration")
            compileFunction(ast.body[i]);
    }

    for(var i = 0; i < ast.body.length; i++)
    {
        compileStatement(ast.body[i]);
    }

    if(isMain)
    {
        var Integer = types.Integer;
        for(var i = 0; i < Integer.statics.length; i++)
            base.unshiftCommand(["scoreboard players set", "static" + Integer.statics[i], Integer.scoreName, Integer.statics[i]].join(" "));

        base.unshiftCommand("scoreboard objectives add " + Integer.scoreName + " dummy CPL Variables");
    }
}
module.exports.scope = scope;

function throwError(message, loc)
{
    var locStr = " at line ";
    if(loc.start.line == loc.end.line)
        locStr += loc.start.line + " column " + loc.start.column;
    else
        locStr += loc.start.line + " column " + loc.start.column + " to line " + loc.end.line + " column " + loc.end.column;

    throw message + locStr;
}

function compileFunction(stmt)
{
    var funcName = stmt.identifier.name;
    var bodyName;

    scope.increase();
    var funcScope = scope.decrease();

    var typeSignature = [];

    var func = function()
    {
        if(stmt.parameters.length != arguments.length)
        {
            throwError("function {0} requires {1} arguments not {2}"
                .format(funcName, stmt.parameters.length, arguments.length), stmt.loc);
        }

        scope.increase(funcScope);
        for(var i = 0; i < stmt.parameters.length; i++)
        {
            var name = stmt.parameters[i].name;
            var val = arguments[i];

            if(typeSignature[i] && !typeMatch(typeSignature[i], val))
            {
                throwError("function {0} requires argument {1} to be {2} not {3}"
                    .format(funcName, i, typeSignature[i].constructor.name, val.constructor.name), stmt.loc);
            }

            if(!typeSignature[i])
                typeSignature[i] = val;

            scope.set(name, createRuntimeVar(val, nextName(name)));
        }
        scope.decrease();

        if(!bodyName)
            bodyName = compileBody(stmt.body, base.ret, funcName, funcScope);

        base.rjump(bodyName);

        return fnReturn;
    };

    func.typeSignature = typeSignature;

    scope.set(funcName, func);
}

function compileBody(body, end, label, bodyScope)
{
    label = label || nextName("body");
    base.addFunction(label, function()
    {
        scope.increase(bodyScope);
        compileStatementList(body);
        scope.decrease();

        if(end)
            end();
    });
    return label;
}

function compileStatementList(stmts)
{
    for(var i = 0; i < stmts.length; i++)
    {
        compileStatement(stmts[i]);
    }
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
    if(!typeMatch(left, right))
        throwError("Incompatible types " + left.constructor.name + " and " + right.constructor.name, loc);
}

function typeMatch(left, right)
{
    var compatibleTypes = [
		[types.Boolean, (true).constructor], //bool
		[types.Integer, types.Float, (0).constructor], //int, float
		[types.String, ("").constructor] //string
	]

	if(left.constructor == right.constructor)
		return true;

	for(var i = 0; i < compatibleTypes.length; i++)
	{
		if(compatibleTypes[i].indexOf(left.constructor) != -1 && compatibleTypes[i].indexOf(right.constructor) != -1)
		{
			return true;
		}
	}

	return false;
}

function checkOperator(val, op, opLabel, loc)
{
    if(typeof val[op] != "function")
        throwError("Type " + val.constructor.name + " does not support operator " + opLabel, loc);
}

function trueify(val, loc)
{
    return boolify(val, true, loc);
}
function falseify(val, loc)
{
    return boolify(val, false, loc);
}

function boolify(val, type, loc)
{
    var label = nextName("trueify");
    if(typeof val == "string")
    {
        if(type)
        {
            return val;
        }
        else
        {
            base.addLabel(label);
            command(val);
            return "testforblock %" + label + ":diff% minecraft:chain_command_block -1 {SuccessCount:0}";
        }
    }
    else if(typeof val != "object")
    {
        val = !val;
        if(type)
            val = !val;
        return val ? "testfor @e" : "falsy: " + val.toString();
    }
    else if(val instanceof types.Boolean)
    {
        return val.isExact(type);
    }
    else if(val instanceof types.String)
    {
        var cmd = val.isExact("");

        if(type)
        {
            base.addLabel(label);
            base.command(cmd);
            return "testforblock %" + label + ":diff% minecraft:chain_command_block -1 {SuccessCount:0}";
        }
        else
        {
            return cmd;
        }
    }
    else if(val.toInteger)
    {
        var fn = val.isExact ? val.isExact : val.toInteger().isExact;
        var cmd = fn.call(val, 0);

        if(type)
        {
            base.addLabel(label);
            base.command(cmd);
            return "testforblock %" + label + ":diff% minecraft:chain_command_block -1 {SuccessCount:0}";
        }
        else
        {
            return cmd;
        }
    }
    else
    {
        throwError("cannot boolify " + val.constructor.name, loc);
    }
}

function createRuntimeVar(val, name)
{
    if(typeof val == "boolean" || val.constructor == types.Boolean)
        return new types.Boolean(val, name);
    else if((typeof val == "number" && Math.round(val) == val) || val.constructor == types.Integer)
        return new types.Integer(val, name);
    else if(typeof val == "number" || val.constructor == types.Float)
        return new types.Float(val, name);
    else if(typeof val == "string" && val[0] == "/")
        return commandToBool(val, name);
    else if(typeof val == "string" || val.constructor == types.String)
        return new types.String(val, name);
}

function commandToBool(cmd, name)
{
    var val = new types.Boolean(false, name);
    command(cmd);
    val.set(true, true);
    return val;
}

var statements = {};
var expressions = {};

statements["AssignmentStatement"] = function(stmt)
{
    if(stmt.variables.length != 1 || stmt.variables[0].type != "Identifier")
        throwError("unsupported left hand side expression", stmt.loc);
    if(stmt.init.length != 1)
        throwError("unsupported right hand side expression", stmt.loc);

    var optimized = optimize.selfAssign(stmt);

    var key = stmt.variables[0].name;

    var oldVal = scope.get(key);
    var rightExpr = optimized ? optimized.argument : stmt.init[0];
    var newVal = compileExpression(rightExpr);

    if(!oldVal)
    {
        var name = nextName(key);
        oldVal = createRuntimeVar(newVal, name, stmt.init[0]);
        scope.set(key, oldVal);
    }
    else if(optimized)
    {
        var ops = {
            "+": "add",
            "-": "remove",
            "*": "multiplicate",
            "/": "divide",
            "%": "mod"
        };
        oldVal[ops[optimized.operator]](newVal);
    }
    else
    {
        checkTypeMismatch(oldVal, newVal, stmt.loc);
        oldVal.set(newVal);
    }
}

statements["FunctionDeclaration"] = function(stmt)
{
    //do nothing
}

statements["ReturnStatement"] = function(stmt)
{
    if(stmt.arguments.length != 1)
        throwError("unsupported right hand side expression", stmt.loc);

    var val = compileExpression(stmt.arguments[0]);
    checkTypeMismatch(val, fnReturn, stmt.loc);
    fnReturn.set(val);

    base.ret();
    block(options.splitterBlock);
}

statements["CallStatement"] = function(stmt)
{
    compileExpression(stmt.expression);
}

statements["IfStatement"] = function(stmt)
{
    var clauses = stmt.clauses;

    var endLabel = nextName("ifend");

    var hasSucess = new types.Boolean(false, nextName("ifsuccess"));

    var hasElse = false;

    for(var i = 0; i < clauses.length; i++)
    {
        var type = clauses[i].type;

        if(type == "IfClause")
        {
            var expr = compileExpression(clauses[i].condition);
            var bodyLabel = compileBody(clauses[i].body, base.jump.bind(base, endLabel));

            command(trueify(expr, clauses[i].condition.loc));

            base.jump(bodyLabel, true);
            hasSucess.set(true, true);
        }
        else if(type == "ElseifClause")
        {
            var expr = compileExpression(clauses[i].condition);
            var bodyLabel = compileBody(clauses[i].body, base.jump.bind(base, endLabel));

            var cmd = trueify(expr, clauses[i].condition.loc);

            command(hasSucess.isExact(false));
            command(cmd, true);

            base.jump(bodyLabel, true);
            hasSucess.set(true, true);
        }
        else if(type == "ElseClause")
        {
            var bodyLabel = compileBody(clauses[i].body, base.jump.bind(base, endLabel));

            command(hasSucess.isExact(false));
            base.jump(bodyLabel, true);

            hasElse = true;
        }
        else
        {
            throwError("unsupported clause " + clauses[i].type, stmt.loc);
        }
    }

    if(!hasElse)
    {
        command(hasSucess.isExact(false));
        base.jump(endLabel, true);
    }

    block(options.splitterBlock);
    base.addLabel(endLabel);
}

statements["WhileStatement"] = function(stmt)
{
    var bodyLabel = nextName("while");
    var checkLabel = bodyLabel + "check";
    var endLabel = bodyLabel + "end";

    base.jump(checkLabel);
    block(options.splitterBlock);

    base.addFunction(bodyLabel, function()
    {
        compileStatementList(stmt.body);

        var condition = compileExpression(stmt.condition);
        base.addLabel(checkLabel);
        command(trueify(condition, stmt.condition.loc));
        base.jump(bodyLabel, true);

        command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
        base.jump(endLabel, true);
    });
    base.addLabel(endLabel);
}

statements["RepeatStatement"] = function(stmt)
{
    var bodyLabel = nextName("repeat");
    var endLabel = bodyLabel + "end";

    base.addLabel(bodyLabel);

    scope.increase();
    compileStatementList(stmt.body);

    var condition = compileExpression(stmt.condition);
    command(falseify(condition, stmt.condition.loc));
    base.jump(bodyLabel, true);

    command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
    base.jump(endLabel, true);

    scope.decrease();
    block(options.splitterBlock);
    base.addLabel(endLabel);
}

function staticLiteral(expr)
{
    return expr.value;
}

expressions["BooleanLiteral"] = staticLiteral;
expressions["NumericLiteral"] = staticLiteral;
expressions["StringLiteral"] = function(expr)
{
    if(expr.value[0] == "/")
    {
        var val = new types.Boolean(false);
        command(expr.value.substr(1));
        val.set(true, true);
        return val;
    }
    else
    {
        return expr.value;
    }
};

expressions["Identifier"] = function(expr)
{
    var val = scope.get(expr.name);
    if(!val)
        throwError("use of undefined variable " + expr.name, expr.loc);
    return val;
}

expressions["CallExpression"] = function(expr)
{
    var base = compileExpression(expr.base);
    var args = [];
    for(var i = 0; i < expr.arguments.length; i++)
        args[i] = compileExpression(expr.arguments[i]);

    if(typeof base != "function")
        throwError(base.constructor.name + " is not a function", expr.loc);

    try
    {
        return base.apply(undefined, args);
    }
    catch (e)
    {
        var fnName = expr.base.name || base.name;
        throwError(e.toString() + "\n- " + "while calling " + fnName, expr.loc);
    }
}

expressions["UnaryExpression"] = function(expr)
{
    var left = compileExpression(expr.argument);

    if(expr.operator == "not")
    {
        return "/" + falseify(left, expr.loc);
    }
    else if(expr.operator == "-")
    {
        if(typeof left == "object")
        {
            var clone = left.isClone ? left : left.clone();
            clone.isClone = true;

            checkOperator(left, "multiplicate", "-", expr.loc);
            clone.multiplicate(-1);

            return clone;
        }
        else
        {
            return -1 * left;
        }
    }
}

expressions["LogicalExpression"] = function(expr)
{
    var left = compileExpression(expr.left);
    var right = compileExpression(expr.right);
    var operator = expr.operator;

    var compileTimeOps = {
        "and": function(a, b) { return a && b; },
        "or": function(a, b) { return a || b; }
    };

    var isLeftCmd = typeof left == "string" && expr.left.type != "StringLiteral";
    var isRightCmd = typeof right == "string" && expr.right.type != "StringLiteral";

    if(isLeftCmd && !isRightCmd)
    {
        left = commandToBool(left);
    }
    else if(isRightCmd && !isLeftCmd)
    {
        right = commandToBool(right);
    }

    if(typeof left != "object" && typeof right != "object" && !(isLeftCmd || isRightCmd))
        return compileTimeOps[operator](left, right);

    var _left = typeof left == "object" ? left : right;
    var _right = typeof left == "object" ? right : left;

    if(typeMatch(left, right) && !(isLeftCmd || isRightCmd))
    {
        var val = new _left.constructor(_left, nextName(operator));
        val.isClone = true;

        if(operator == "and")
        {
            var isLeftTrue = trueify(_left, expr.loc);
            command(isLeftTrue);
            val.set(_right, true);
        }
        else if(operator == "or")
        {
            var isLeftFalse = falseify(_left, expr.loc);
            command(isLeftFalse);
            val.set(_right, true);
        }

        return val;
    }
    else
    {
        if(operator == "and")
        {
            var val = new types.Boolean(false, nextName("and"));
            val.isClone = true;
            var isLeftTrue = trueify(_left, expr.loc);
            var isRightTrue = trueify(_right, expr.loc);

            command(isLeftTrue);
            command(isRightTrue, true);
            val.set(true, true);

            return val;
        }
        else if(operator == "or")
        {
            var val = new types.Boolean(true, nextName("and"));
            val.isClone = true;
            var isLeftFalse = falseify(_left, expr.loc);
            var isRightFalse = falseify(_right, expr.loc);

            command(isLeftFalse);
            command(isRightFalse, true);
            val.set(false, true);

            return val;
        }
    }
}

expressions["BinaryExpression"] = function(expr)
{
    var left = compileExpression(expr.left);
    var right = compileExpression(expr.right);
    var operator = expr.operator;

    checkTypeMismatch(left, right, expr.loc);

    var noCommutative = ["/", "%", "<", ">", "<=", ">="];

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
            return a.isExact(b);
        },
        "~=": function(a, b)
        {
            checkOperator(a, "isExact", operator, expr.loc);
            var label = nextName("not");
            base.addLabel(label);
            command(a.isExact(b));
            return "testforblock %" + label + ":diff% minecraft:chain_command_block -1 {SuccessCount:0}";
        },
        ">": function(a, b)
        {
            checkOperator(a, "isBetweenEx", operator, expr.loc);
            return a.isBetweenEx(b, undefined);
        },
        "<": function(a, b)
        {
            checkOperator(a, "isBetweenEx", operator, expr.loc);
            return a.isBetweenEx(undefined, b);
        },
        ">=": function(a, b)
        {
            checkOperator(a, "isBetween", operator, expr.loc);
            return a.isBetween(b, undefined);
        },
        "<=": function(a, b)
        {
            checkOperator(a, "isBetween", operator, expr.loc);
            return a.isBetween(undefined, b);
        }
    }

    if(typeof left != "object" && typeof right != "object")
    {
        return compileTimeOps[operator](left, right);
    }
    else if(typeof right == "object" && (typeof left == "object"  || noCommutative.indexOf(operator) != -1))
    {
        var op = runtimeOps[operator];

        if(typeof left != "object")
            left = createRuntimeVar(left);

        checkOperator(left, "clone", "clone", expr.loc);
        var clone = left.isClone ? left : left.clone();
        clone.isClone = true;

        if(typeof op == "string")
        {
            checkOperator(clone, op, operator, expr.loc);
            clone[op](right);
            return clone;
        }
        else
        {
            checkOperator(left, "remove", "-", expr.loc);
            clone.remove(right);
            return "/" + op(clone, 0);
        }
    }
    else
    {
        var _left = typeof left == "object" ? left : right;
        var _right = typeof right == "object" ? left : right;

        var op = runtimeOps[operator];
        if(typeof op == "string")
        {
            checkOperator(_left, "clone", "clone", expr.loc);
            var clone = _left.isClone ? _left : _left.clone();
            clone.isClone = true;

            checkOperator(clone, op, operator, expr.loc);
            clone[op](_right);
            return clone;
        }
        else
        {
            return "/" + op(_left, _right);
        }
    }
}
