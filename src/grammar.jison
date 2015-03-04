%lex
%%

// tokens

\s+                      { /* ignore */ }

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
'api'                    { return 'API'; }
'return'                 { return 'RETURN'; }

'if'                     { return 'IF'; }

'while'                  { return 'WHILE'; }
'do'                     { return 'DO'; }
'for'                    { return 'FOR'; }

'true'                   { return 'TRUE'; }
'false'                  { return 'FALSE'; }

[0-9]+                   { return 'NUMBER'; }
[a-zA-Z_][a-zA-Z_0-9]*   { return 'CHAR_SEQUENCE'; }

'\n'                     { return 'NEWLINE'; }

\"[a-zA-Z0-9!§$%&/()=?{}#+_.:,\s]*\" { return 'STRING'; } //" pls sublime

<<EOF>>                  { return 'EOF'; }

/lex


%%

// pls sublime again

Program
	: StatementList EOF
		{
			return function()
			{
				for(var i = 0; i < $1.length; i++)
				{
					if(typeof $1[i] != 'undefined')
						$1[i]();
				}
			};
		}
	;

StatementList
	: StatementList Statement StatementSeperator
		{ $$ = $1.concat($2); }
	|
		{ $$ = []; }
	;

StatementSeperator
	: ';'
	| 'NEWLINE'
	|
	;



AssignmentOperator
	: "="
		{ $$ = function(left, right) { checkOperator(left, "set", "=", @1); left.set(right); } }
	| "+="
		{ $$ = function(left, right) { checkOperator(left, "add", "+=", @1); left.add(right); }; }
	| "-="
		{ $$ = function(left, right) { checkOperator(left, "remove", "-=", @1); left.remove(right); }; }
	| "*="
		{ $$ = function(left, right) { checkOperator(left, "multiplicate", "*=", @1); left.multiplicate(right); }; }
	| "/="
		{ $$ = function(left, right) { checkOperator(left, "divide", "/=", @1); left.divide(right); }; }
	;
SingleAssignmentOperator
	: "++"
		{ $$ = function(left) { checkOperator(left, "add", "++", @1); left.add(1); }; }
	| "--"
		{ $$ = function(left) { checkOperator(left, "remove", "--", @1); left.remove(1); }; }
	;

ComparationOperator
	: "=="
		{ $$ = function(left, right, callback, other) { checkOperator(left, "isExact", "==", @1); return left.isExact(right, callback); }; }
	| ">"
		{ $$ = function(left, right, callback, other) { checkOperator(left, "isBetween", ">", @1); return left.isBetween(right + 1, '*', callback); }; }
	| "<"
		{ $$ = function(left, right, callback, other) { checkOperator(left, "isBetween", "<", @1); return left.isBetween('*', right - 1, callback); }; }
	| ">="
		{ $$ = function(left, right, callback, other) { checkOperator(left, "isBetween", ">=", @1); return left.isBetween(right, '*', callback); }; }
	| "<="
		{ $$ = function(left, right, callback, other) { checkOperator(left, "isBetween", "<=", @1); return left.isBetween('*', right, callback); }; }
	;



Statement
	: Block
	| AssignStatement
	| FunctionCall
	| ApiDefinition
	| ReturnStatement
	| IfStatement
	| WhileStatement
	| DoWhileStatement
	| ForStatement
    ;



ApiDefinition
	: 'API' CHAR_SEQUENCE '(' ArgumentDefinitionList ')' Block
		{
			$$ = undefined;
			functions[$2] = function()
			{
				for(var i = 0; i < arguments.length && i < $4.length; i++)
					vars[$4[i]] = arguments[i];

				return $6();
			}
		}
	;

ReturnStatement
	: 'RETURN' InlineVariable
		{
			$$ = function()
			{
				return $2();
			}
		}
	;

ArgumentDefinitionList
	: ArgumentDefinitionList CHAR_SEQUENCE
		{ $$ = $1.concat($2); }
	|
		{ $$ = []; }
	;



FunctionCall
	: CHAR_SEQUENCE '(' ParameterList ')'
		{
			$$ = function()
			{
				if(vars[$1] instanceof Runtime.Callback)
				{
					Util.assert($3.length < 1, "Delegates do not support parameter! At line {0} column {1} to {2}"
						.format(@3.first_line, @3.first_column, @3.last_column));
					vars[$1].emit();
				}
				else if(functions[$1])
				{
					var func = functions[$1];

					var args = [];
					for(var i = 0; i < $3.length; i++)
						args[i] = $3[i]();

					return func.apply(undefined, args);
				}
				else
				{
					Util.assert(!typeMismatch(vars[$1], right), "TypeError: {0} is not a function at line {1} column {2} to {3}"
						.format($1, @2.first_line, @2.first_column, @2.last_column));

					throw "";
				}
			};
		}
	;

ParameterList
	: ParameterList ',' InlineVariable
		{ $$ = $1.concat($3); }
	| InlineVariable
		{ $$ = [$1]; }
	;



InlineVariable
	: Boolean
		{ $$ = function() { return $1; } }
	| NUMBER
		{ $$ = function() { return parseInt($1); }; }
	| 'STRING'
		{ $$ = function() { return $1.substr(1, $1.length - 2); }; }
	| CHAR_SEQUENCE
		{ $$ = function() { checkUndefined($1, @1); return vars[$1] || functions[$1]; }; }
	| 'FUNCTION' '(' ')' Block
		{
			$$ = function()
			{
				return function()
				{
					$4();
				};
			}
		}
	| FunctionCall
		{ $$ = $1; }
	;



Boolean
	: 'TRUE'
		{ $$ = true; }
	| 'FALSE'
		{ $$ = false; }
	;



AssignStatement
	: CHAR_SEQUENCE AssignmentOperator InlineVariable
		{
			$$ = function()
			{
				var right = $3();
				if(typeof right == 'undefined')
					return;

				if(typeof vars[$1] == 'undefined')
				{

					if(right instanceof Runtime.Boolean || typeof right == 'boolean')
						vars[$1] = new Runtime.Boolean($1);
					else if(right instanceof Runtime.Integer || typeof right == 'number')
						vars[$1] = new Runtime.Integer(0, $1);
					else if(typeof right == 'string')
						vars[$1] = new Runtime.String($1);
					else if(typeof right == 'function')
						vars[$1] = new Runtime.Callback();
					else if(typeof Runtime[right.constructor.name] != 'undefined')
						vars[$1] = new Runtime[right.constructor.name]();
					else
						throw "unknown variable type '{0}'".format(right.constructor.name);
				}
				else if(typeof vars[$1] != 'object')
				{
					if(typeof vars[$1] == 'boolean')
					{
						vars[$1] = new Runtime.Boolean(vars[$1], $1);
					}
					else if(typeof vars[$1] == 'number')
					{
						vars[$1] = new Runtime.Integer(vars[$1], $1);
					}
					else if(typeof vars[$1] == 'string')
					{
						var val = vars[$1];
						vars[$1] = new Runtime.String($1);
						vars[$1].set(val);
					}
					else if(typeof vars[$1] == 'function')
					{
						var val = vars[$1];
						vars[$1] = new Runtime.Callback();
						vars[$1].set(val);
					}
				}

				Util.assert(!typeMismatch(vars[$1], right), "Type mismatch: cannot assign {0} to {1} at line {2} column {3} to {4}"
					.format(right.constructor.name, vars[$1].constructor.name, @2.first_line, @2.first_column, @2.last_column));


				$2(vars[$1], right);
			};
		}
	;



ValidateExpression
	: InlineVariable
		{
			$$ = function(callback)
			{
				var left = $1();

				Util.assert(!typeMismatch(left, true), "Type mismatch: cannot compare {0} and {1} at line {2} column {3} to {4}"
					.format("boolean", left.constructor.name, @1.first_line, @1.first_column, @1.last_column));

				if(left instanceof Runtime.Boolean)
				{
					return left.isTrue(callback);
				}
				else if(typeof left == 'boolean' && left)
				{
					call(callback);

					return new MinecraftCommand("testfor @e");
				}
				else
				{
					return new MinecraftCommand("comparation of {0} and {1} was false".format(left, "true"));
				}

			};
		}
	| InlineVariable ComparationOperator InlineVariable
		{
			$$ = function(callback)
			{
				var left = $1();
				var right = $3();

				Util.assert(!typeMismatch(left, right), "Type mismatch: cannot compare {0} and {1} at line {2} column {3} to {4}"
					.format(right.constructor.name, left.constructor.name, @2.first_line, @2.first_column, @2.last_column));

				if(typeof left != 'object' && typeof right != 'object')
				{
					if(left == right)
					{
						if(typeof callback != 'undefined')
							call(callback);

						return new MinecraftCommand("testfor @e");
					}
					else
					{
						return new MinecraftCommand("comparation of {0} and {1} was false".format(left, right));
					}

				}
				else if(typeof left == 'object' && typeof right == 'object')
				{
					checkOperator(left, "clone", "clone", @1);
					checkOperator(left, "remove", "-=", @1);

					var copy = left.clone();
					copy.remove(right);

					return $2(copy, 0, callback, right);
				}
				else
				{
					var _left = (typeof left == 'object') ? left : right;
					var _right = (typeof left == 'object') ? right : left;

					return $2(_left, _right, callback, left);
				}
			};
		}
	;



Block
	: '{' StatementList '}'
		{
			$$ = function()
			{
				for(var i = 0; i < $2.length; i++)
				{
					var back = $2[i]();
					if(typeof back != 'undefined')
						return back;
				}
			}
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

function checkOperator(obj, member, operator, line)
{
	var type = obj.constructor.name;

	Util.assert(typeof obj[member] != 'undefined', "Object of type '" + type + "' does not support operator '" + operator + "' at line " + line.first_line);
}

function checkUndefined(name, line)
{
	Util.assert(vars[name] || functions[name], "Unknown identifier '"+name+"' at line "+line.first_line+" column "+line.first_column+" to "+line.last_column);
}

function typeMismatch(left, right)
{
	if(left.constructor == right.constructor)
		return false;
	else if(left instanceof Runtime.Boolean && typeof right == 'boolean')
		return false;
	else if(left instanceof Runtime.Integer && typeof right == 'number')
		return false;
	else if(left instanceof Runtime.String && typeof right == 'string')
		return false;
	else if(left instanceof Runtime.Callback && typeof right == 'function')
		return false
	else
		return true;
}

var functions = {};

//assign api functions to vars
for(var name in cplApi)
{
	functions[name] = cplApi[name];
}
