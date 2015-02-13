#Commandblock Programming Language
Commandblock Programming Language
is a javascript-like programming language that compiles to full-vanilla commandblock constructions.
The main concept is that what you write is commandblock logic not code that will be executed and the output will be the logic like in CommandblocksJS
Even though CPL is based on CommandblocksJS (and jison (for parsing cpl code))

##Features (so far)
- integer
- strings
- functions
- if
- while / do while
- for

##Planned
- full integration of CommandblocksJS features
- a return statement
- arrays?!

##NOT planned
- classes -> there are no classes in minecraft so why should we have classes in a programming language representing commandblock logic
- any runtime stuff like the use of for loops with CommandblocksJS

##Example code
```javascript
a = 1;
a += 3;
a *= 3;

b = 3;
b *= a;

outputAll();

while(a < 42)
{
	a++;
	if(a == b)
		out("if a isnt 36 now smomething is wrong");
}

function outputAll()
{
	out(a);
	out(b);
}
```
