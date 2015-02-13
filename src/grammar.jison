%lex
%%

"=="                     { return '=='; }
"<"                      { return '<'; }
">"                      { return '>'; }
"<="                     { return '<='; }
">="                     { return '>='; }

"="                      { return '='; }
"+="                     { return '+='; }
"-="                     { return '-='; }
"*="                     { return '*='; }
"/="                     { return '/='; }

"++"                     { return '++'; }
"--"                     { return '--'; }

";"                      { return ';'; }
","                      { return ','; }
"("                      { return '('; }
")"                      { return ')'; }
"{"                      { return '{'; }
"}"                      { return '}'; }

'function'               { return 'FUNCTION'; }
'if'                     { return 'IF'; }
'else'                   { return 'ELSE'; }

'while'                  { return 'WHILE'; }
'do'                     { return 'DO'; }
'for'                    { return 'FOR'; }

[0-9]+                   { return 'NUMBER'; }
[a-zA-Z_][a-zA-Z_0-9]*   { return 'CHAR_SEQUENCE'; }

\"[a-zA-Z0-9!§$%&/()=?{}#+_.:,\s]*\" { return 'STRING'; } //"

<<EOF>>                  { return 'EOF'; }
\s+                      { /* ignore */ }

/lex

%start Program

%%

Program
	: StatementList EOF
		{
			return function()
			{
				for(var i = 0; i < $1.length; i++)
				{
					$1[i]();
				}
			};
		}
	;

StatementList
	: StatementList Statement
		{ $$ = $1.concat($2); }
	| EmptyArray Statement
		{ $$ = $1.concat($2); }
	;

EmptyArray
	:
		{ $$ = []; }
	;



AssignmentOperator
	: "="
		{ $$ = function(left, right) { checkOperator(left, right, "set", "=", @1); left.set(right); } }
	| "+="
		{ $$ = function(left, right) { checkOperator(left, right, "add", "+=", @1); left.add(right); }; }
	| "-="
		{ $$ = function(left, right) { checkOperator(left, right, "remove", "-=", @1); left.remove(right); }; }
	| "*="
		{ $$ = function(left, right) { checkOperator(left, right, "multiplicate", "*=", @1); left.multiplicate(right); }; }
	| "/="
		{ $$ = function(left, right) { checkOperator(left, right, "divide", "/=", @1); left.divide(right); }; }
	;
SingleAssignmentOperator
	: "++"
		{ $$ = function(left) { checkOperator(left, {type: left.type || left.constructor.name}, "add", "++", @1); left.add(1); }; }
	| "--"
		{ $$ = function(left) { checkOperator(left, {type: left.type || left.constructor.name}, "remove", "--", @1); left.remove(1); }; }
	;

ComparationOperator
	: "=="
		{ $$ = function(left, right, callback, other) { checkOperator(left, other, "isExact", "==", @1); return left.isExact(right, callback); }; }
	| ">"
		{ $$ = function(left, right, callback, other) { checkOperator(left, other, "isBetween", ">", @1); return left.isBetween(right + 1, '*', callback); }; }
	| "<"
		{ $$ = function(left, right, callback, other) { checkOperator(left, other, "isBetween", "<", @1); return left.isBetween('*', right - 1, callback); }; }
	| ">="
		{ $$ = function(left, right, callback, other) { checkOperator(left, other, "isBetween", ">=", @1); return left.isBetween(right, '*', callback); }; }
	| "<="
		{ $$ = function(left, right, callback, other) { checkOperator(left, other, "isBetween", "<=", @1); return left.isBetween('*', right, callback); }; }
	;



Statement
	: Block
	| AssignStatement
	| FunctionCall
	| FunctionDefinition
	| IfStatement
	| WhileStatement
	| DoWhileStatement
	| ForStatement
    ;



FunctionDefinition
	: FUNCTION CHAR_SEQUENCE '(' ')' Statement
		{
			vars[$2] = createCplFunction([], $5);
			$$ = function() {};
		}
	| FUNCTION CHAR_SEQUENCE '(' CHAR_SEQUENCE ParameterList ')' Statement
		{
			var args = $4.concat($5);
			vars[$2] = createCplFunction(args, $7);
			$$ = function() {};
		}
	;

FunctionCall
	: CHAR_SEQUENCE '(' CHAR_SEQUENCE ParameterList ')' ';'
		{
			$$ = function()
			{
				checkUndefined($1, @1);
				var args = [vars[$3]].concat($4);
				return vars[$1].value.apply(undefined, args);
			};
		}
	| CHAR_SEQUENCE '(' CHAR_SEQUENCE ')' ';'
		{
			$$ = function()
			{
				checkUndefined($1, @1);
				return vars[$1].value.apply(undefined, [vars[$3]]);
			};
		}
	| CHAR_SEQUENCE '(' InlineVariable ParameterList ')' ';'
		{
			$$ = function()
			{
				checkUndefined($1, @1);
				var args = [$3].concat($4);
				return vars[$1].value.apply(undefined, args);
			};
		}
	| CHAR_SEQUENCE '(' InlineVariable ')' ';'
		{
			$$ = function()
			{
				checkUndefined($1, @1);
				return vars[$1].value.apply(undefined, [$3]);
			};
		}
	| CHAR_SEQUENCE '('  ')' ';'
		{
			$$ = function()
			{
				return vars[$1].value.apply(undefined, []);
			}
		}
	;



ParameterList
	: ParameterList ',' InlineVariable
		{ $$ = $1.concat($3); }
	| ParameterList ',' CHAR_SEQUENCE
		{ $$ = $1.concat($3); }
	| EmptyArray ',' InlineVariable
		{ $$ = $1.concat($3); }
	| EmptyArray ',' CHAR_SEQUENCE
		{ $$ = $1.concat($3); }
	;

InlineVariable
	: NUMBER
		{
			$$ = parseInt($1);
		}
	| STRING
		{
			$$ = $1.replace(/\"/g, "");
		}
	| FUNCTION '(' CHAR_SEQUENCE ParameterDefinitionList ')' Statement
		{
			var args = $3.concat($4);
			$$ = createCplFunction(args, $6);
		}
	;



Block
	: '{' StatementList '}'
		{
			$$ = function()
			{
				for(var i = 0; i < $2.length; i++)
				{
					$2[i]();
				}
			}
		}
	;



AssignStatement
	: CHAR_SEQUENCE AssignmentOperator InlineVariable ';'
		{
			$$ = function()
			{
				variableAssignment($1, $2, $3);
			}
		}
	| CHAR_SEQUENCE AssignmentOperator CHAR_SEQUENCE ';'
		{
			$$ = function()
			{
				checkUndefined($3, @3);
				variableAssignment($1, $2, vars[$3]);
			}
		}
	| CHAR_SEQUENCE AssignmentOperator FunctionCall ';'
		{
			$$ = function()
			{
				checkUndefined($3, @3);
				var out = $3();
				variableAssignment($1, $2, out);
			}
		}
	| CHAR_SEQUENCE SingleAssignmentOperator ';'
		{
			$$ = function()
			{
				if(typeof vars[$1] == 'undefined')
					vars[$1] = new Runtime.Integer(0, $1);

				$2(vars[$1]);
			};
		}
	;

ValidateExpression
	: CHAR_SEQUENCE ComparationOperator InlineVariable
		{
			$$ = function(callback)
			{
				checkUndefined($1, @1);

				var cp = vars[$1].clone();
				cp.remove($3);

				return $2(cp, 0, callback, $3);
			};
		}
	| CHAR_SEQUENCE ComparationOperator CHAR_SEQUENCE
		{
			$$ = function(callback)
			{
				checkUndefined($1, @1);
				checkUndefined($3, @3);

				var cp = vars[$1].clone();
				cp.remove(vars[$3]);

				return $2(cp, 0, callback, vars[$3]);
			};
		}
	;



IfStatement
	: IF '(' ValidateExpression ')' Statement
		{
			$$ = function()
			{
				$3($5);
			};
		}
	;

WhileStatement
	: WHILE '(' ValidateExpression ')' Statement
		{
			$$ = function()
			{
				var repeat = function()
				{
					$5();
					$3(repeat);
				}
				$3(repeat);
			};
		}
	;

DoWhileStatement
	: DO Statement WHILE '(' ValidateExpression ')' ';'
		{
			var repeat = function()
			{
				$5();
				$3(repeat);
			}
			call(repeat);
		}
	;

ForStatement
	: FOR '(' AssignStatement ';' ValidateExpression ';' AssignStatement ')' Statement
		{
			$$ = function()
			{
				$3();
				var repeat = function()
				{
					$9();
					$7();
					$5(repeat);
				}
				$5(repeat);
			};
		}
	;

%%

function checkOperator(obj, other, member, operator, line)
{
	var type = obj.type || obj.constructor.name;
	var otherType = other.type || other.constructor.name;

	Util.assert(typeof obj[member] != 'undefined', "Object of type '" + type + "' does not support operator '" + operator + "' at line " + line.first_line);

	if(typeof other == 'object')
	{
		Util.assert(
			type == otherType || typeof other["to"+type] != 'undefined',
			"Type mismatch: '" + type + "' " + operator + " '" + otherType + "' at line " + line.first_line
		);
	}
}

function checkUndefined(name, line)
{
	Util.assert(typeof vars[name] != 'undefined', "Unknown identifier '"+name+"' at line "+line.first_line+" column "+line.first_column+" to "+line.last_column);
}

function createCplFunction(params, body)
{
	for(var i = 0; i < params.length; i++)
	{
		Util.assert(typeof params[i] == 'string', "Function definition parameter lists only support CHAR_SEQUENCE.");
	}

	return new Container(function()
	{
		args = arguments;
		call(function()
		{
			for(var i = 0; i < args.length; i++)
			{
				vars[params[i]] = vars[params[i]] || vars[args[i]].constructor.call();
				vars[params[i]].set(args[i]);
			}
			body();
		});
	});
}

function variableAssignment(name, operator, right)
{
	if(typeof vars[name] == 'undefined')
	{
		if(right instanceof Runtime.Integer || typeof right == 'number')
			vars[name] = new Runtime.Integer(0, name);
		else if(typeof right == 'string')
			vars[name] = new Runtime.String(name);
		else
			vars[name] = Object.create(right.constructor.prototype);
	}

	operator(vars[name], right);
}

function Container(value)
{
	this.value = value;

	this.type = value.constructor.name;

	this.set = function(val)
	{
		this.value = val;
	}
	this.isExact = function(val, callback)
	{
		if(this.value == val)
			call(callback);
		else
			command("CPL if([object Container] == " + val.toString() + ") was false");
	}
	this.toTellrawExtra = function()
	{
		return new Chat.Message(this.value.toString());
	}
}

//assign api functions to vars
for(var name in cplApi)
	vars[name] = new Container(cplApi[name]);
