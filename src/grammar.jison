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

'static'                 { return 'STATIC_KEYWORD'; }
'async'                  { return 'ASYNC_KEYWORD'; }

'if'                     { return 'IF'; }
'else'                   { return 'ELSE'; }

'while'                  { return 'WHILE'; }
'do'                     { return 'DO'; }
'for'                    { return 'FOR'; }

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

'@'[prae]('['[a-zA-Z0-9,=!]*']')? { return 'SELECTOR' }

[a-zA-Z_][a-zA-Z_0-9]*   { return 'IDENTIFIER'; }

\"((\\\")|[^\"])*\"      { return 'STRING'; } //"

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



ModifierList
	: ModifierList Modifier
		{ $$ = $1.concat($2); }
	|
		{ $$ = []; }
	;

Modifier
	: 'ASYNC_KEYWORD'
	| 'STATIC_KEYWORD'
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
		{ $$ = function(left, right, callback, stepToNext) { checkOperator(left, "isBetween", ">", @1); return left.isBetween(right + stepToNext, undefined, callback); }; }
	| "<"
		{ $$ = function(left, right, callback, stepToNext) { checkOperator(left, "isBetween", "<", @1); return left.isBetween(undefined, right - stepToNext, callback); }; }
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
	| AsyncFunctionCall ';'
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
		{ $$ = function() { return $1.substr(1, $1.length - 2).replace(/\\\"/g, "\""); }; }
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
	;



Boolean
	: 'TRUE'
		{ $$ = true; }
	| 'FALSE'
		{ $$ = false; }
	;



DefinitionStatement
	: ModifierList VariableType 'IDENTIFIER'
		{
			checkModifiers($1, $2.allowedModifiers, $2.modifierErrorLabel, @1);
			$$ = function()
			{
				if($1.indexOf("static") === -1)
				{
					checkDefined($3, @3);
					vars[$3] = $2(undefined, $3);
				}
				else
				{
					vars[$3] = new StaticVariable();
				}

			};
		}
	| ModifierList VariableType 'IDENTIFIER' '=' InlineVariable
		{
			checkModifiers($1, $2.allowedModifiers, $2.modifierErrorLabel, @1);
			$$ = function()
			{
				if($1.indexOf("static") === -1)
				{
					checkDefined($3, @3);
					vars[$3] = $2($5(), $3);
				}
				else
				{
					vars[$3] = new StaticVariable($5());
				}
			};
		}
	;



VariableType
	: 'BOOL_KEYWORD'
		{
			$$ = function(value, name)
			{
				var val = new Runtime.Boolean(false, name);
				if(typeof value != 'undefined')
					val.set(value);
				return val;
			};
			$$.defaultValue = false;
			$$.allowedModifiers = ["static"];
			$$.modifierErrorLabel = "boolean definition";
		}
	| 'INT_KEYWORD'
		{
			$$ = function(value, name)
			{
				var val = new Runtime.Integer(0, name);
				if(typeof value != 'undefined')
					val.set(value);
				return val;
			};
			$$.defaultValue = 0;
			$$.allowedModifiers = ["static"];
			$$.modifierErrorLabel = "integer definition";
		}
	| 'FIXED_KEYWORD'
		{
			$$ = function(value, name)
			{
				var val = new Runtime.Decimal(0, name);
				if(typeof value != 'undefined')
					val.set(value);
				return val;
			};
			$$.defaultValue = 0.0;
			$$.allowedModifiers = ["static"];
			$$.modifierErrorLabel = "fixed definition";
		}
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
			$$.allowedModifiers = ["static"];
			$$.modifierErrorLabel = "string definition";
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
			$$.allowedModifiers = [];
			$$.modifierErrorLabel = "delegate definition";
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
			$$.allowedModifiers = [];
			$$.modifierErrorLabel = "object definition";
		}
	;


AssignStatement
	: InlineVariable AssignmentOperator InlineVariable
		{
			$$ = function()
			{
				var left = $1();
				var right = $3();

				Util.assert(!typeMismatch(left, right), "Type mismatch: cannot assign {0} to {1} at line {2} column {3} to {4}"
					.format(right.constructor.name, left.constructor.name, @2.first_line, @2.first_column, @2.last_column));


				$2(left, right);
			};
		}
	| 'IDENTIFIER' SingleAssignmentOperator
		{
			$$ = function()
			{
				checkUndefined($1, @1);

				$2(vars[$1]);
			};
		}
	;



ValidateExpression
	: InlineVariable
		{
			$$ = function(callback)
			{
				var left = $1();

				if(typeof left == 'string')
				{
					return new MinecraftCommand(left);
				}

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

					var stepToNext = copy instanceof Runtime.Decimal ? 0.01 : 1;

					return $2(copy, 0, callback, stepToNext);
				}
				else
				{
					var _left = (typeof left == 'object') ? left : right;
					var _right = (typeof left == 'object') ? right : left;

					var stepToNext = _left instanceof Runtime.Decimal ? 0.01 : 1;

					return $2(_left, _right, callback, stepToNext);
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
	: ModifierList 'IF' '(' ValidateExpression ')' SingleStatement 'ELSE' SingleStatement
		{
			checkModifiers($1, ["async", "static"], "if statements", @1);
			$$ = function()
			{
				var stmt = new ifElseStatement($4, $6, $8);
				runModifiedStatement(stmt, $1);
			}
		}
	| ModifierList 'IF' '(' ValidateExpression ')' SingleStatement
		{
			checkModifiers($1, ["async", "static"], "if statements", @1);
			$$ = function()
			{
				var stmt = new ifStatement($4, $6);
				runModifiedStatement(stmt, $1);
			};
		}
	;

WhileStatement
	: ModifierList 'WHILE' '(' ValidateExpression ')' SingleStatement
		{
			checkModifiers($1, ["async", "static"], "while loops", @1);
			$$ = function()
			{
				var stmt = new whileStatement($4, $6, true);
				runModifiedStatement(stmt, $1);
			};
		}
	;

DoWhileStatement
	: ModifierList 'DO' SingleStatement 'WHILE' '(' ValidateExpression ')'
		{
			checkModifiers($1, ["async", "static"], "do-while loops", @1);
			$$ = function()
			{
				var stmt = new whileStatement($6, $3, false);
				runModifiedStatement(stmt, $1);
			}
		}
	;

ForStatement
	: ModifierList 'FOR' '(' DefinitionStatement ';' ValidateExpression ';' AssignStatement ')' SingleStatement
		{
			checkModifiers($1, ["async", "static"], "for loops", @1);
			$$ = function()
			{
				var stmt = new forStatement($4, $6, $8, $10);
				runModifiedStatement(stmt, $1);
			};
		}
	;

%%
