var base = require("./lib/base.js");
var types = require("./lib/types.js");
var nextName = require("./lib/naming.js");
var optimize = require("./lib/optimize.js");
var scope = require("./lib/Scope.js");

var currRet = [];
var breakLabel;

var compile = function(ast, path, isMain)
{
    for(var i = 0; i < ast.body.length; i++)
    {
        compileStatement(ast.body[i]);
    }

    optimize.garbageCollect();
};
compile.scope = scope;
module.exports = compile;

function throwError(message, loc)
{
    var locStr = " at line ";
    if(loc.start.line == loc.end.line)
        locStr += loc.start.line + " column " + loc.start.column + " in " + compile.file;
    else
        locStr += loc.start.line + " column " + loc.start.column + " to line " + loc.end.line + " column " + loc.end.column + " in " + compile.file;

    throw message + locStr;
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
		[types.Integer, types.Float, types.Score, (0).constructor, types.Boolean, (true).constructor], //int, float
        [types.Table, Array], //table, array
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
    else if(val instanceof Array || val instanceof types.Table)
        return new types.Table(val, name);
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
    function assign(left, newVal, optimized)
    {
        var key;
        var oldVal;
        if(left.type == "Identifier")
        {
            key = left.name;
            oldVal = scopeGet(key);
        }
        else if(left.type == "IndexExpression")
        {
            var index = compileExpression(left.index);
            var base = compileExpression(left.base);

            base.setAt(index, newVal);
            return;
        }
        else
        {
            oldVal = compileExpression(left);
        }

        if(!oldVal && key)
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
        else if(oldVal)
        {
            checkTypeMismatch(oldVal, newVal, stmt.loc);
            oldVal.set(newVal);
        }
        else
        {
            throwError("Invalid assign statement", stmt.loc);
        }
    }


    var rest;
    for(var i = 0; i < stmt.variables.length && i < stmt.init.length; i++)
    {
        var left = stmt.variables[i];
        var right = stmt.init[i];

        var optimized = optimize.selfAssign(left, right);

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

        assign(left, newVal, optimized);
    }

    for(var i = 0; i < rest.length; i++)
    {
        var left = stmt.variables[i + stmt.init.length];
        if(!left)
            return;

        var newVal = rest[i];

        assign(left, newVal);
    }
}

function resolveType(name, loc)
{
    var alias = {
        "Boolean": ["bool", "boolean"],
        "Integer": ["int", "i32", "integer", "number"],
        "Float": ["float"],
        "String": ["string"],
        "Table": ["table", "array"]
    };

    name = name.toLowerCase();
    for(var key in alias)
    {
        if(alias[key].indexOf(name) != -1)
            return types[key];
    }

    throwError("Unknown type " + name, loc);
}

var statements = {};
var expressions = {};

statements["AssignmentStatement"] = function(stmt)
{
    assignStatement(stmt, scope.get.bind(scope), scope.setGlobal.bind(scope));
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
    var funcName = stmt.identifier.name;
    var bodyName;

    scope.increase();
    var funcStack = scope.save();
    scope.decrease();

    var typeSignature = [];
    var returnSignature = false;
    var argNames = [];

    var func = function()
    {
        if(stmt.parameters.length != arguments.length)
        {
            throwError("function {0} requires {1} arguments not {2}"
                .format(funcName, stmt.parameters.length, arguments.length), stmt.loc);
        }

        var _stack = scope.save();
        scope.load(funcStack);
        for(var i = 0; i < stmt.parameters.length; i++)
        {
            var name;
            if(stmt.parameters[i].type == "TypedIdentifier")
                name = stmt.parameters[i].identifier.name;
            else
                name = stmt.parameters[i].name;

            var val = arguments[i];

            if(typeSignature[i] && !typeMatch(typeSignature[i], val))
            {
                throwError("function {0} requires argument {1} to be {2} not {3}"
                    .format(funcName, i, typeSignature[i].constructor.name, val.constructor.name), stmt.loc);
            }

            if(!typeSignature[i])
            {
                argNames[i] = nextName(name);
                val = createRuntimeVar(val, argNames[i])
                typeSignature[i] = val;
                scope.set(name, val);
            }
            else
            {
                scope.get(name).set(val);
            }
        }
        scope.load(_stack);

        if(!bodyName)
        {
            bodyName = funcName;

            var _currRet = currRet;

            currRet = returnSignature;
            scope.load(funcStack);
            compileBody(stmt.body, base.ret, funcName);
            scope.load(_stack);
            returnSignature = currRet;


            currRet = _currRet;

            func.funcName = funcName;
            func.typeSignature = typeSignature;
            func.returnSignature = returnSignature;
        }


        base.rjump(bodyName);

        return returnSignature;
    };

    var _stack = scope.save();
    scope.load(funcStack);

    var allTyped = true;
    for(var i = 0; i < stmt.parameters.length; i++)
    {
        var param = stmt.parameters[i];
        if(param.type == "TypedIdentifier")
        {
            var name = param.identifier.name;
            var ctor = resolveType(param.varType.name, param.varType.loc);

            typeSignature[i] = new ctor(0, nextName(name), true);
            scope.set(name, typeSignature[i]);
        }
        else
        {
            allTyped = false;
            continue;
        }
    }
    if(allTyped)
        func.typeSignature = typeSignature;

    if(stmt.returnTypes.length == 1 && stmt.returnTypes[0].name == "void")
    {
        returnSignature = [];
        func.returnSignature = returnSignature;
    }
    else if(stmt.returnTypes.length > 0)
    {
        returnSignature = [];
        for(var i = 0; i < stmt.returnTypes.length; i++)
        {
            var typeName = stmt.returnTypes[i].name;
            var ctor = resolveType(typeName, stmt.returnTypes[i].loc);

            var name = nextName("ret" + i + typeName);
            returnSignature[i] = new ctor(0, name, true);
        }
        func.returnSignature = returnSignature;
    }
    else
    {
        allTyped = false;
    }

    if(allTyped)
    {
        bodyName = funcName;

        var _currRet = currRet;

        currRet = returnSignature;
        compileBody(stmt.body, base.ret, funcName);
        currRet = _currRet;

        func.funcName = funcName;
    }

    scope.load(_stack);

    if(stmt.isLocal)
        scope.set(funcName, func);
    else
        scope.setGlobal(funcName, func);
};

statements["ReturnStatement"] = function(stmt)
{
    var args = [];
    for(var i = 0; i < stmt.arguments.length; i++)
    {
        args[i] = compileExpression(stmt.arguments[i]);
    }

    if(currRet)
    {
        if(stmt.arguments.length != currRet.length)
            throwError("cannot return a different count of arguments than before", stmt.loc);

        for(var i = 0; i < currRet.length && i < args.length; i++)
        {
            if(!typeMatch(currRet[i], args[i]))
                throwError("cannot return a different type signature than before", stmt.arguments[i].loc);

            currRet[i].set(args[i]);
        }
    }
    else
    {
        currRet = [];
        for(var i = 0; i < args.length; i++)
        {
            var name = nextName("ret" + i + args[i].constructor.name);
            currRet[i] = createRuntimeVar(args[i], name);
        }
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

statements["ForNumericStatement"] = function(stmt)
{
    var iteratorName = stmt.variable.name;
    var start = compileExpression(stmt.start);
    var end = compileExpression(stmt.end);

    var iterator = createRuntimeVar(start, nextName(iteratorName));
    var step = stmt.step ? compileExpression(stmt.step) : 1;

    var checkCondition;
    if(typeof step == "number" && typeof end == "number")
    {
        checkCondition = function()
        {
            if(step > 0)
                return iterator.isBetween(undefined, end);
            else if(step <= 0)
                return iterator.isBetween(end, undefined);
        };
    }
    else if(typeof step == "number" && typeof end == "object")
    {
        checkCondition = function()
        {
            checkOperator(end, "clone", "clone", stmt.end.loc);
            var clone = end.clone();
            clone.remove(iterator);
            if(step > 0)
                return clone.isBetween(0, undefined);
            else if(step <= 0)
                return clone.isBetween(undefined, 0);
        };
    }
    else if(typeof step == "object" && typeof end == "number")
    {
        checkCondition = function()
        {
            var success = new types.Boolean(false, "forsuccess");

            command(step.isBetweenEx(0, undefined));
            command(iterator.isBetween(undefined, end), true);
            success.set(true, true);

            command(step.isBetween(undefined, 0));
            command(iterator.isBetween(end, undefined), true);
            success.set(true, true);

            return success.isExact(true);
        };
    }
    else if(typeof step == "object" && typeof end == "object")
    {
        checkCondition = function()
        {
            var success = new types.Boolean(false, "forsuccess");

            checkOperator(end, "clone", "clone", stmt.end.loc);
            var clone = end.clone();
            clone.remove(iterator);

            command(step.isBetweenEx(0, undefined));
            command(clone.isBetween(0, undefined), true);
            success.set(true, true);

            command(step.isBetween(undefined, 0));
            command(clone.isBetween(undefined, 0), true);
            success.set(true, true);

            return success.isExact(true);
        };
    }

    scope.increase();
    scope.set(iteratorName, iterator);
    var forScope = scope.decrease();

    var bodyLabel = nextName("for");
    var checkLabel = bodyLabel + "check";
    var endLabel = bodyLabel + "end";

    var _breakLabel = breakLabel;
    breakLabel = endLabel;

    base.jump(checkLabel);
    block(options.splitterBlock);

    base.addFunction(bodyLabel, function()
    {
        scope.increase(forScope);

        compileStatementList(stmt.body);

        if(typeof step == "object")
            iterator.add(step);
        else if(step < 0)
            iterator.remove(-step);
        else if(step > 0)
            iterator.add(step);

        base.addLabel(checkLabel);
        command(checkCondition());
        base.jump(bodyLabel, true);
        command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
        base.jump(endLabel, true);

        scope.decrease();
    });

    base.addLabel(endLabel);
    scope.increase(forScope);
    optimize.garbageCollect();
    scope.decrease();

    breakLabel = _breakLabel;
};

statements["DoStatement"] = function(stmt)
{
    scope.increase();
    compileStatementList(stmt.body);
    optimize.garbageCollect();
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

    scope.increase();
    var whileScope = scope.decrease();

    base.addFunction(bodyLabel, function()
    {
        scope.increase(whileScope);

        compileStatementList(stmt.body);

        base.addLabel(checkLabel);
        var condition = compileExpression(stmt.condition);
        command(trueify(condition, stmt.condition.loc));
        base.jump(bodyLabel, true);

        command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
        base.jump(endLabel, true);

        scope.decrease();
    });

    base.addLabel(endLabel);
    scope.increase(whileScope);
    optimize.garbageCollect();
    scope.decrease();

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

    block(options.splitterBlock);
    base.addLabel(endLabel);
    optimize.garbageCollect();
    scope.decrease();

    breakLabel = _breakLabel;
};

expressions["TableConstructorExpression"] = function(expr)
{
    var args = [];
    for(var i = 0; i < expr.fields.length; i++)
    {
        if(expr.fields[i].type != "TableValue")
            throwError("Unsupported table field type", field.loc);

        args[i] = compileExpression(expr.fields[i].value);
    }

    return [args];
}

expressions["IndexExpression"] = function(expr)
{
    var base = compileExpression(expr.base);

    checkOperator(base, "get", "[index]", expr.base.loc);

    var index = compileExpression(expr.index);

    return base.get(index);
}

function valueLiteral(expr)
{
    return expr.value;
}

expressions["BooleanLiteral"] = valueLiteral;
expressions["NumericLiteral"] = function(expr)
{
    if(expr.raw && expr.raw.indexOf(".") != -1 && Math.floor(expr.value) == expr.value)
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
    {
        args[i] = compileExpression(expr.arguments[i]);
    }

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
        if(left.hasOwnProperty("length"))
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
