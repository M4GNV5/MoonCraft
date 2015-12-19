var base = require("./lib/base.js");
var types = require("./lib/types.js");
var nextName = require("./lib/naming.js");
var optimize = require("./lib/optimize.js");
var scope = require("./lib/Scope.js");

var fnReturns = [];
var currRetSignature = [];
var breakLabel;

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

    optimize.garbageCollect();

    if(isMain)
    {
        var Integer = types.Integer;
        for(var i = 0; i < Integer.statics.length; i++)
            base.unshiftCommand(["scoreboard players set", "static" + Integer.statics[i], Integer.scoreName, Integer.statics[i]].join(" "));

        base.unshiftCommand("scoreboard objectives add " + Integer.scoreName + " dummy MoonCraft Variables");
    }
};
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
    var returnSignature = [];
    var argNames = [];

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
            {
                typeSignature[i] = val;
                argNames[i] = nextName(name);
            }

            scope.set(name, createRuntimeVar(val, argNames[i]));
        }
        scope.decrease();

        if(!bodyName)
        {
            var _currRetSignature = currRetSignature;

            currRetSignature = false;
            bodyName = compileBody(stmt.body, base.ret, funcName, funcScope);
            returnSignature = currRetSignature;

            currRetSignature = _currRetSignature;
        }


        base.rjump(bodyName);

        var retValue = [];
        for(var i = 0; i < returnSignature.length; i++)
        {
            var type = returnSignature[i].constructor.name;
            retValue[i] = fnReturns[i][type];
        }
        return retValue;
    };

    func.typeSignature = typeSignature;
    func.returnSignature = returnSignature;

    scope.set(funcName, func);
}

function compileBody(body, end, label, bodyScope)
{
    label = label || nextName("body");
    base.addFunction(label, function()
    {
        var _body = optimize.removeDeadEnds(body);

        scope.increase(bodyScope);
        compileStatementList(_body);
        optimize.garbageCollect();
        scope.decrease();

        if(end && body == _body)
            end();
    });
    return label;
}

function compileStatementList(stmts)
{
    stmts = optimize.removeDeadEnds(stmts);
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

function compileExpression(expr, supportArrays)
{
    var type = expr.type;

    if(!expressions.hasOwnProperty(type))
        throwError("unknown expression type " + type, expr.loc);

    var val = expressions[type](expr);

    if(!supportArrays && val instanceof Array)
        return val[0];
    else
        return val;
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
		[types.Integer, types.Float, types.Score, (0).constructor], //int, float
		[types.String, ("").constructor] //string
	];

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
    else if(val instanceof types.Score)
        return val;
}

function commandToBool(cmd, name)
{
    var val = new types.Boolean(false, name);
    command(cmd);
    val.set(true, true);
    return val;
}

function assignStatement(stmt, scopeGet, scopeSet)
{
    function assign(key, oldVal, newVal, optimized)
    {
        if(!oldVal)
        {
            var name = nextName(key);
            oldVal = createRuntimeVar(newVal, name);
            scopeSet(key, oldVal);
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


    var rest;
    for(var i = 0; i < stmt.variables.length && i < stmt.init.length; i++)
    {
        var left = stmt.variables[i];
        var right = stmt.init[i];

        if(left.type != "Identifier")
            throwError("unsupported left hand side expression", stmt.loc);

        var optimized = optimize.selfAssign(left, right);

        var key = left.name;

        var oldVal = scopeGet(key);
        var rightExpr = optimized ? optimized.argument : right;
        var newVal = compileExpression(rightExpr, true);

        if(newVal instanceof Array)
        {
            rest = newVal.slice(1);
            newVal = newVal[0];
        }
        else
        {
            rest = [];
        }

        assign(key, oldVal, newVal, optimized);
    }

    for(var i = 0; i < rest.length; i++)
    {
        var left = stmt.variables[i + stmt.init.length];

        if(!left)
            return;
        if(left.type != "Identifier")
            throwError("unsupported left hand side expression", stmt.loc);

        var key = left.name;
        var oldVal = scopeGet(key);
        var newVal = rest[i];

        assign(key, oldVal, newVal);
    }
}

var statements = {};
var expressions = {};

statements["AssignmentStatement"] = function(stmt)
{
    assignStatement(stmt, scope.get.bind(scope), scope.set.bind(scope));
};

statements["LocalStatement"] = function(stmt)
{
    assignStatement(stmt, function(key)
    {
        return scope.current()[key];
    }, scope.set.bind(scope));
};

statements["FunctionDeclaration"] = function(stmt)
{
    //do nothing
};

statements["ReturnStatement"] = function(stmt)
{
    var args = [];
    for(var i = 0; i < stmt.arguments.length; i++)
    {
        args[i] = compileExpression(stmt.arguments[i]);
    }

    if(currRetSignature)
    {
        if(stmt.arguments.length != currRetSignature.length)
            throwError("cannot return a different count of arguments than before", stmt.loc);

        for(var i = 0; i < currRetSignature.length && i < args.length; i++)
        {
            if(!typeMatch(currRetSignature[i], args[i]))
                throwError("cannot return a different type signature than before", stmt.arguments[i].loc);
        }
    }
    else
    {
        currRetSignature = args;
    }

    fnReturns = [];
    for(var i = 0; i < args.length; i++)
    {
        var val = args[i];
        var type = val.constructor.name;

        fnReturns[i] = fnReturns[i] || {};

        if(fnReturns[i][type])
            fnReturns[i][type].set(val);
        else
            fnReturns[i][type] = createRuntimeVar(val, "ret" + i + type);
    }

    base.ret();
    block(options.splitterBlock);
};

statements["BreakStatement"] = function(stmt)
{
    if(!breakLabel)
        throwError("Invalid break statement", stmt.loc);

    base.jump(breakLabel);
    block(options.splitterBlock);
};

statements["CallStatement"] = function(stmt)
{
    compileExpression(stmt.expression);
};

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
};

statements["DoStatement"] = function(stmt)
{
    scope.increase();
    compileStatementList(stmt.body);
    scope.decrease();
};

statements["WhileStatement"] = function(stmt)
{
    var bodyLabel = nextName("while");
    var checkLabel = bodyLabel + "check";
    var endLabel = bodyLabel + "end";

    var _breakLabel = breakLabel;
    breakLabel = endLabel;

    base.jump(checkLabel);
    block(options.splitterBlock);

    base.addFunction(bodyLabel, function()
    {
        compileStatementList(stmt.body);

        base.addLabel(checkLabel);
        var condition = compileExpression(stmt.condition);
        command(trueify(condition, stmt.condition.loc));
        base.jump(bodyLabel, true);

        command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
        base.jump(endLabel, true);
    });
    base.addLabel(endLabel);

    breakLabel = _breakLabel;
};

statements["RepeatStatement"] = function(stmt)
{
    var bodyLabel = nextName("repeat");
    var endLabel = bodyLabel + "end";

    var _breakLabel = breakLabel;
    breakLabel = endLabel;

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

    breakLabel = _breakLabel;
};

function valueLiteral(expr)
{
    return expr.value;
}

expressions["BooleanLiteral"] = valueLiteral;
expressions["NumericLiteral"] = function(expr)
{
    if(expr.raw.indexOf(".") != -1 && Math.floor(expr.value) == expr.value)
        return expr.value + 0.000001;
    else
        return expr.value;
};
expressions["StringLiteral"] = valueLiteral;

expressions["Identifier"] = function(expr)
{
    var val = scope.get(expr.name);
    if(!val)
        throwError("use of undefined variable " + expr.name, expr.loc);
    return val;
};

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

        if(options.debug)
        {
            console.log("- while calling " + fnName);
            throw e;
        }

        throwError(e.toString() + "\n- while calling " + fnName, expr.loc);
    }
};

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
    else if(expr.operator == "#")
    {
        if(typeof left == "object")
            throwError("Cannot get the length of a variable of a runtime variable", expr.loc);
        else if(left.hasOwnProperty("length"))
            return left.length;
        else
            throwError("Cannot get the length of a variable of type " + left.constructor.name, expr.loc);
    }
};

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
};

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
        "..": function(a, b) { return a.toString() + b.toString(); },
        "^": function(a, b) { return Math.pow(a, b); },
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
        "..": function(a, b)
        {
            throwError("Operator '..' is not supported for runtime variables", expr.loc);
        },
        "^": function(a, b)
        {
            throwError("Unsupported operator '^' use the math function 'pow' instead", expr.loc);
        },
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
    };

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
};
