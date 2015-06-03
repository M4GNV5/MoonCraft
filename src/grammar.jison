%lex
%%

// tokens

\s+                      { /* ignore */ }

'//'.*($|\r\n|\r|\n)     { /* ignore */ }

"=="                     { return '=='; }
"<="                     { return '<='; }
">="                     { return '>='; }
"<"                      { return '<'; }
">"                      { return '>'; }

"="                      { return '='; }
"+="                     { return '+='; }
"-="                     { return '-='; }
"*="                     { return '*='; }
"/="                     { return '/='; }
"%="                     { return '%='; }

"++"                     { return '++'; }
"--"                     { return '--'; }

"."                      { return '.'; }
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

'new'                    { return 'NEW'; }

'bool'                   { return 'BOOL_KEYWORD'; }
'int'                    { return 'INT_KEYWORD'; }
'fixed'                  { return 'FIXED_KEYWORD'; }
'string'                 { return 'STRING_KEYWORD'; }
'delegate'               { return 'DELEGATE_KEYWORD'; }
'object'                 { return 'OBJECT_KEYWORD'; }

'true'                   { return 'TRUE'; }
'false'                  { return 'FALSE'; }

'-'?[0-9]+'.'[0-9]{0,2}  { return 'DECIMAL'; }
'-'?[0-9]+               { return 'INTEGER'; }

'@'[prae]'['[a-zA-Z0-9,=!]+']' { return 'SELECTOR' }

[a-zA-Z_][a-zA-Z_0-9]*  { return 'IDENTIFIER'; }

'"'[^"]*'"'              { return 'STRING'; } //'

<<EOF>>                  { return 'EOF'; }

/lex

%%

// pls sublime

Program
	: StatementList EOF
		{
			return function()
			{
				var startFunc = outputHandler.current;
				needsHelperCommands = [];

				for(var i = 0; i < $1.length; i++)
				{
					if(typeof $1[i] != 'undefined')
						$1[i]();
				}

				for(var i = 0; i < needsHelperCommands.length; i++)
					outputHandler.addCallHelperCommands(needsHelperCommands[i]);

				outputHandler.current = startFunc;
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
	| "%="
		{ $$ = function(left, right) { checkOperator(left, "divide", "%=", @1); left.set(right, Runtime.NumberSetMode.divisionRemainder); }; }
	;
SingleAssignmentOperator
	: "++"
		{ $$ = function(left) { checkOperator(left, "add", "++", @1); left.add(1); }; }
	| "--"
		{ $$ = function(left) { checkOperator(left, "remove", "--", @1); left.remove(1); }; }
	;

ComparationOperator
	: "=="
		{ $$ = function(left, right, callback) { checkOperator(left, "isExact", "==", @1); return left.isExact(right, callback); }; }
	| ">"
		{ $$ = function(left, right, callback) { checkOperator(left, "isBetween", ">", @1); return left.isBetween(right + 1, undefined, callback); }; }
	| "<"
		{ $$ = function(left, right, callback) { checkOperator(left, "isBetween", "<", @1); return left.isBetween(undefined, right - 1, callback); }; }
	| ">="
		{ $$ = function(left, right, callback) { checkOperator(left, "isBetween", ">=", @1); return left.isBetween(right, undefined, callback); }; }
	| "<="
		{ $$ = function(left, right, callback) { checkOperator(left, "isBetween", "<=", @1); return left.isBetween(undefined, right, callback); }; }
	;



SingleStatement
	: Block
	| AssignStatement ';'
	| DefinitionStatement ';'
	| InlineVariable ';'
	;



Statement
	: SingleStatement
	| FunctionDefinition
	| IfStatement
	| WhileStatement
	| DoWhileStatement
	| ForStatement
    ;




FunctionDefinition
	: 'FUNCTION' 'IDENTIFIER' '(' ParameterDefinitionList ')' Block
		{
			$$ = function() {};

			functions[$2] = function()
			{
				Util.assert($4.length == arguments.length, "Invalid call signature: function {0} requries {1} arguments not {2}"
					.format($2, $4.length, arguments.length));

				for(var i = 0; i < $4.length; i++)
				{
					var ctor = $4[i].ctor;
					var name = $4[i].name;
					
					Util.assert(!typeMismatch(ctor.defaultValue, arguments[i]), "Type mismatch: function {0} requires argument {1} to be of type {2} not {3}"
						.format($2, name, ctor.defaultValue.constructor.name, arguments[i].constructor.name));

					if(typeof arguments[i] == 'object')
						vars[name] = arguments[i];
					else
						vars[name] = ctor(arguments[i], name);
				}


				$6();
			};
		}
	;

ParameterDefinitionList
	: ParameterDefinitionList ',' VariableType 'IDENTIFIER'
		{ $$ = $1.concat({ctor: $3, name: $4}); }
	| VariableType 'IDENTIFIER'
		{ $$ = [{ctor: $1, name: $2}]; }
	|
		{ $$ = []; }
	;



FunctionCall
	: InlineVariable '(' ParameterList ')'
		{
			$$ = function()
			{
				var left = $1();
				if(left instanceof Runtime.Callback)
				{
					Util.assert($3.length < 1, "Delegates do not support parameter! At line {0} column {1} to {2}"
						.format(@3.first_line, @3.first_column, @3.last_column));
					left.emit();
				}
				else if(typeof left == 'function')
				{
					var args = [];
					for(var i = 0; i < $3.length; i++)
						args[i] = $3[i]();

					return left.apply(left.parent, args);
				}
				else
				{
					throw "TypeError: {0} is not a function at line {1} column {2} to {3}"
						.format(left, @2.first_line, @2.first_column, @2.last_column);
				}
			};
		}
	;

ParameterList
	: ParameterList ',' InlineVariable
		{ $$ = $1.concat($3); }
	| InlineVariable
		{ $$ = [$1]; }
	|
		{ $$ = []; }
	;



InlineVariable
	: Boolean
		{ $$ = function() { return $1; } }
	| 'INTEGER'
		{ $$ = function() { return parseInt($1); }; }
	| 'DECIMAL'
		{ $$ = function() { return parseFloat($1); }; $$.decimal = true; }
	| 'STRING'
		{ $$ = function() { return $1.substr(1, $1.length - 2); }; }
	| 'IDENTIFIER'
		{ $$ = function() { checkUndefined($1, @1, true); return vars[$1] || functions[$1]; }; }
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
	| 'SELECTOR'
		{ $$ = function() { return Entities.Selector.parse($1); } }
	| FunctionCall
		{ $$ = $1; }
	| InlineVariable '.' 'IDENTIFIER'
		{
			$$ = function()
			{
				var parent = $1();
				if(typeof parent[$3] == 'undefined')
					throw "Cannot read property {0} at line {1} column {2} to {3}"
						.format($3, @3.first_line, @3.first_column, @3.last_column);

				var child = $1()[$3];
				child.parent = parent;

				return child;
			};
		}
	| 'NEW' InlineVariable '(' ParameterList ')'
		{
			$$ = function()
			{
				Util.assert(typeof $2 == 'function', "Cannot create instance of {0} at line {1} column {2} to {3}"
					.format($2.toString(), @2.first_line, @2.first_column, @2.last_column));

				var ctor = $2();

				var args = [];
				for(var i = 0; i < $4.length; i++)
					args[i] = $4[i]();

				function construct(constructor, ctorArgs)
				{
				    function _ctor()
				    {
				        return constructor.apply(this, ctorArgs);
				    }
				    _ctor.prototype = constructor.prototype;
				    return new _ctor();
				}

				return construct(ctor, $4);
			}
		}
	;



Boolean
	: 'TRUE'
		{ $$ = true; }
	| 'FALSE'
		{ $$ = false; }
	;



DefinitionStatement
	: VariableType 'IDENTIFIER'
		{ $$ = function() { checkDefined($2, @2); vars[$2] = $1(undefined, $2); }; }
	| VariableType 'IDENTIFIER' '=' InlineVariable
		{ $$ = function() { checkDefined($2, @2); vars[$2] = $1($4(), $2); }; }
	;



VariableType
	: 'BOOL_KEYWORD'
		{ $$ = function(value, name) { return new Runtime.Boolean(value, name); }; $$.defaultValue = false; }
	| 'INT_KEYWORD'
		{ $$ = function(value, name) { return new Runtime.Integer(value, name); }; $$.defaultValue = 0; }
	| 'FIXED_KEYWORD'
		{ $$ = function(value, name) { return new Runtime.Decimal(value, name); }; $$.defaultValue = 0.0; }
	| 'STRING_KEYWORD'
		{
			$$ = function(value, name)
			{
				var val = new Runtime.String(name);
				if(typeof value != 'undefined')
					val.set(value);

				return val;
			};
			$$.defaultValue = "";
		}
	| 'DELEGATE_KEYWORD'
		{
			$$ = function(value, name)
			{
				var val = new Runtime.Callback();
				if(typeof value != 'undefined')
					val.add(value);

				return val;
			};
			$$.defaultValue = function() {};
		}
	| 'OBJECT_KEYWORD'
		{
			$$ = function(value, name)
			{
				if(typeof value == 'undefined')
					throw "object needs intialization value at line {0} colums {1} to {2}".format(@1.first_line, @1.first_column, @1.last_column);
				else
					return value;
			};
			$$.defaultValue = {};
		}
	;


AssignStatement
	: 'IDENTIFIER' AssignmentOperator InlineVariable
		{
			$$ = function()
			{
				var right = $3();
				if(typeof right == 'undefined')
					return;

				checkUndefined($1, @1);

				Util.assert(!typeMismatch(vars[$1], right), "Type mismatch: cannot assign {0} to {1} at line {2} column {3} to {4}"
					.format(right.constructor.name, vars[$1].constructor.name, @2.first_line, @2.first_column, @2.last_column));


				$2(vars[$1], right);
			};
		}
	| 'IDENTIFIER' SingleAssignmentOperator
		{
			$$ = function()
			{
				checkUndefined($1, @1);

				$2(vars[$1]);
			}
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



					return $2(_left, _right, callback);
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
					$2[i]();
			}
		}
	;

IfStatement
	: 'IF' '(' ValidateExpression ')' SingleStatement 'ELSE' SingleStatement
		{
			$$ = function()
			{
				var next = startNewFunction();
				$3().validate(function()
				{
					$5();
					call(next.func);
				}, function()
				{
					$7();
					call(next.func);
				});
				next.goNext();
			}
		}
	| 'IF' '(' ValidateExpression ')' SingleStatement
		{
			$$ = function()
			{
				var next = startNewFunction();
				$3().validate(function()
				{
					$5();
					call(next.func);
				}, next.func);
				next.goNext();
			};
		}
	;

WhileStatement
	: 'WHILE' '(' ValidateExpression ')' SingleStatement
		{
			$$ = function()
			{
				var next = startNewFunction();
				var repeat = function()
				{
					$5();
					$3().validate(repeat, next.func);
				}
				$3().validate(repeat, next.func);
				next.goNext();
			};
		}
	;

DoWhileStatement
	: 'DO' SingleStatement 'WHILE' '(' ValidateExpression ')'
		{
			$$ = function()
			{
				var next = startNewFunction();
				var repeat = function()
				{
					$2();
					$3().validate(repeat, next.func);
				}
				call(repeat);
				next.goNext();
			}
		}
	;

ForStatement
	: 'FOR' '(' DefinitionStatement ';' ValidateExpression ';' AssignStatement ')' SingleStatement
		{
			$$ = function()
			{
				var next = startNewFunction();
				$3();
				var repeat = function()
				{
					$9();
					$7();
					$5().validate(repeat, next.func);
				}
				$5().validate(repeat, next.func);
				next.goNext();
			};
		}
	;

%%

//assign api functions to vars
for(var name in cplApi)
{
	functions[name] = cplApi[name];
}
