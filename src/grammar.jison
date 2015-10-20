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

'bool'                   { return 'BOOL_KEYWORD'; }
'int'                    { return 'INT_KEYWORD'; }
'float'                  { return 'FLOAT_KEYWORD'; }
'string'                 { return 'STRING_KEYWORD'; }

'return'                 { return 'RETURN'; }

'if'                     { return 'IF'; }
'else'                   { return 'ELSE'; }

'while'                  { return 'WHILE'; }
'do'                     { return 'DO'; }
'for'                    { return 'FOR'; }

'true'                   { return 'TRUE'; }
'false'                  { return 'FALSE'; }

'-'?[0-9]+'.'[0-9]{0,2}  { return 'DECIMAL'; }
'-'?[0-9]+               { return 'INTEGER'; }

[a-zA-Z_][a-zA-Z_0-9]*   { return 'IDENTIFIER'; }

'"'((\\\")|[^"])+'"'     { yytext = yytext.slice(1, -1).replace(/\\"/g, "\""); return 'STRING'; }

<<EOF>>                  { return 'EOF'; }

/lex

%%

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
	|
	;



AssignmentOperator
	: "="
		{ $$ = function(left, right) { util.checkOperator(left, "set", "=", @1); left.set(right); } }
	| "+="
		{ $$ = function(left, right) { util.checkOperator(left, "add", "+=", @1); left.add(right); }; }
	| "-="
		{ $$ = function(left, right) { util.checkOperator(left, "remove", "-=", @1); left.remove(right); }; }
	| "*="
		{ $$ = function(left, right) { util.checkOperator(left, "multiplicate", "*=", @1); left.multiplicate(right); }; }
	| "/="
		{ $$ = function(left, right) { util.checkOperator(left, "divide", "/=", @1); left.divide(right); }; }
	| "%="
		{ $$ = function(left, right) { util.checkOperator(left, "mod", "%=", @1); left.mod(right); }; }
	;
SingleAssignmentOperator
	: "++"
		{ $$ = function(left) { util.checkOperator(left, "add", "++", @1); left.add(1); }; }
	| "--"
		{ $$ = function(left) { util.checkOperator(left, "remove", "--", @1); left.remove(1); }; }
	;

ComparationOperator
	: "=="
		{ $$ = function(left, right) { util.checkOperator(left, "isExact", "==", @1); return left.isExact(right); }; }
	| ">"
		{ $$ = function(left, right) { util.checkOperator(left, "isBetweenEx", ">", @1); return left.isBetweenEx(right, undefined); }; }
	| "<"
		{ $$ = function(left, right) { util.checkOperator(left, "isBetweenEx", "<", @1); return left.isBetweenEx(undefined, right); }; }
	| ">="
		{ $$ = function(left, right) { util.checkOperator(left, "isBetween", ">=", @1); return left.isBetween(right, undefined); }; }
	| "<="
		{ $$ = function(left, right) { util.checkOperator(left, "isBetween", "<=", @1); return left.isBetween(undefined, right); }; }
	;



SingleStatement
	: Block
	| AssignStatement ';'
	| DefinitionStatement ';'
	| InlineVariable ';'
	| ReturnStatement ';'
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
	: VariableType 'IDENTIFIER' '(' ParameterDefinitionList ')' Block
		{
			$$ = function() {};

			functions[$2] = function()
			{
				util.assert($4.length == arguments.length, "Invalid call signature: function {0} requries {1} arguments not {2}"
					.format($2, $4.length, arguments.length));

				for(var i = 0; i < $4.length; i++)
				{
					var ctor = $4[i].ctor;
					var name = $4[i].name;
					var varName = $2 + "_" + name;

					util.assert(!util.typeMismatch(ctor.defaultValue, arguments[i]), "Type mismatch: function {0} requires argument {1} to be of type {2} not {3}"
						.format($2, name, ctor.typeName, arguments[i].constructor.name));

					if(typeof arguments[i] == 'object' && typeof vars[name] == 'object')
					{
						util.checkOperator(vars[name], "set", "=", @4);
						vars[name].set(arguments[i]);
					}
					else
					{
						vars[name] = ctor(arguments[i], varName);
					}
				}

				base.rjump($2);

				base.addFunction($2, function()
				{
					fnReturns[$1.typeName] = $1(undefined, "ret_" + $1.typeName);
					$6();
					base.ret();
				});

				return fnReturns[$1.typeName];
			};

			$$.typeName = $1.typeName;
			functions[$2].typeName = $1.typeName;
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



VariableType
	: 'BOOL_KEYWORD'
		{
			$$ = function(startVal)
			{
				return new types.Boolean(startVal);
			};
			$$.typeName = "Boolean";
			$$.defaultValue = false;
		}
	| 'INT_KEYWORD'
		{
			$$ = function(startVal, name)
			{
				return new types.Integer(startVal, name);
			};
			$$.typeName = "Integer";
			$$.defaultValue = 0;
		}
	| 'FLOAT_KEYWORD'
		{
			$$ = function(startVal)
			{
				return new types.Float(startVal);
			};
			$$.typeName = "Float";
			$$.defaultValue = 0.0;
		}
	| 'STRING_KEYWORD'
		{
			$$ = function(startVal)
			{
				return new types.String(startVal);
			};
			$$.typeName = "String";
			$$.defaultValue = "";
		}
	;



FunctionCall
	: InlineVariable '(' ParameterList ')'
		{
			$$ = function()
			{
				var val = $1();

				if(typeof val == 'function')
				{
					var args = [];
					for(var i = 0; i < $3.length; i++)
						args[i] = $3[i]();

					return val.apply(undefined, args);
				}
				else if(typeof val == 'string')
				{
					if($3.length > 0)
					{
						throw "Cannot give arguments to command at line {0} column {1} to {2}"
							.format(@2.first_line, @2.first_column, @2.last_column);
					}

					command(val);
				}
				else
				{
					throw "TypeError: {0} is not a function at line {1} column {2} to {3}"
						.format(val, @2.first_line, @2.first_column, @2.last_column);
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
		{ $$ = function() { return $1; }; $$.typeName = "Boolean"; }
	| 'INTEGER'
		{ $$ = function() { return parseInt($1); }; $$.typeName = "Integer"; }
	| 'DECIMAL'
		{ $$ = function() { return parseFloat($1); }; $$.typeName = "Float"; }
	| 'STRING'
		{ $$ = function() { return $1; }; $$.typeName = "String"; }
	| 'IDENTIFIER'
		{ $$ = function() { util.checkUndefined($1, @1, true); return vars[$1] || functions[$1]; }; }
	| FunctionCall
		{ $$ = $1; $$.typeName = $1.typeName; }
	;



Boolean
	: 'TRUE'
		{ $$ = true; }
	| 'FALSE'
		{ $$ = false; }
	;



DefinitionStatement
	: VariableType 'IDENTIFIER'
		{
			$$ = function()
			{
				util.checkDefined($2, @2);
				vars[$2] = $1(undefined, $2);
			};
		}
	| VariableType 'IDENTIFIER' '=' InlineVariable
		{
			$$ = function()
			{
				util.checkDefined($2, @2);
				vars[$2] = $1($4(), $2);
			};
		}
	;



AssignStatement
	: InlineVariable AssignmentOperator InlineVariable
		{
			$$ = function()
			{
				var left = $1();
				var right = $3();

				util.assert(!util.typeMismatch(left, right), "Type mismatch: cannot assign {0} to {1} at line {2} column {3} to {4}"
					.format(right.constructor.name, left.constructor.name, @2.first_line, @2.first_column, @2.last_column));


				$2(left, right);
			};
		}
	| 'IDENTIFIER' SingleAssignmentOperator
		{
			$$ = function()
			{
				util.checkUndefined($1, @1);

				$2(vars[$1]);
			};
		}
	;



ValidateExpression
	: InlineVariable
		{
			$$ = function(callback)
			{
				var val = $1();

				if(typeof left == 'string')
					return left;

				checkOperator(left, "isExact", "== true", @1);
				return left.isExact(true);
			};
		}
	| InlineVariable ComparationOperator InlineVariable
		{
			$$ = function()
			{
				var left = $1();
				var right = $3();

				util.assert(!util.typeMismatch(left, right), "Type mismatch: cannot compare {0} and {1} at line {2} column {3} to {4}"
					.format(left.constructor.name, right.constructor.name, @2.first_line, @2.first_column, @2.last_column));

				if(typeof left == 'object' && typeof right == 'object')
				{
					util.checkOperator(left, "clone", "clone", @1);
					copy = left.clone("comparation");

					util.checkOperator(copy, "remove", "-=", @1);
					copy.remove(right);

					return $2(copy, 0);
				}
				else
				{
					var _left = (typeof left == 'object') ? left : right;
					var _right = (typeof left == 'object') ? right : left;

					return $2(_left, _right);
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

ReturnStatement
	: 'RETURN' InlineVariable
		{
			$$ = function()
			{
				var val = $2();
				var typeName = $2.typeName || val.constructor.name;

				util.assert(fnReturns[typeName] && typeof fnReturns[typeName].set == "function",
					"Invalid return statement at line {0} column {1} to {2}"
						.format(@1.first_line, @1.first_column, @1.last_column));

				fnReturns[typeName].set(val);

				base.ret();
			}
		}
	;

IfStatement
	: 'IF' '(' ValidateExpression ')' SingleStatement 'ELSE' SingleStatement
		{
			$$ = function()
			{
				var ifName = util.nextName("if");
				var elseName = ifName + "else";
				var endName = ifName + "end";

				command($3());
				base.jump(ifName, true);
				command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
				base.jump(elseName, true);

				base.addFunction(ifName, function()
				{
					$5();
					base.jump(endName, false);
				});
				base.addFunction(elseName, function()
				{
					$7();
					base.jump(endName, false);
				});

				block(options.splitterBlock);
				base.addLabel(endName);
			}
		}
	| 'IF' '(' ValidateExpression ')' SingleStatement
		{
			$$ = function()
			{
				var name = util.nextName("if");
				var endName = name + "end";

				command($3());
				base.jump(name, true);
				command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
				base.jump(endName, true);

				base.addFunction(name, function()
				{
					$5();
					base.jump(endName, false);
				});

				block(options.splitterBlock);
				base.addLabel(endName);
			};
		}
	;

WhileStatement
	: 'WHILE' '(' ValidateExpression ')' SingleStatement
		{
			$$ = function()
			{
				var name = util.nextName("while");
				var checkName = name + "check";
				var endName = name + "end";

				base.jump(checkName);

				base.addFunction(name, function()
				{
					$5();

					base.addLabel(checkName);
					command($3());
					base.jump(name, true);
					command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
					base.jump(endName, true);
				});

				block(options.splitterBlock);
				base.addLabel(endName);
			};
		}
	;

DoWhileStatement
	: 'DO' SingleStatement 'WHILE' '(' ValidateExpression ')'
		{
			$$ = function()
			{
				var name = util.nextName("do");
				var endName = name + "end";

				base.addFunction(name, function()
				{
					$2();

					command($5());
					base.jump(name, true);
					command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
					base.jump(endName, true);
				});

				block(options.splitterBlock);
				base.addLabel(endName);
			};
		}
	;

ForStatement
	: 'FOR' '(' DefinitionStatement ';' ValidateExpression ';' AssignStatement ')' SingleStatement
		{
			$$ = function()
			{
				var name = util.nextName("for");
				var checkName = name + "check";
				var endName = name + "end";

				$3();
				base.jump(checkName);

				base.addFunction(name, function()
				{
					$9();
					$7();

					base.addLabel(checkName);
					command($5());
					base.jump(name, true);
					command("testforblock %-2:diff% minecraft:chain_command_block -1 {SuccessCount:0}");
					base.jump(endName, true);
				});

				block(options.splitterBlock);
				base.addLabel(endName);
			};
		}
	;

%%

var vars = {};
var functions = {};
var fnReturns = {};
var util = new (require("./lib/util.js"))(vars, functions);
var types = require("./lib/types.js");
var base = require("./lib/base.js");
