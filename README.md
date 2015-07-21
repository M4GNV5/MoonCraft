#Commandblock Programming Language
Commandblock Programming Language
is a javascript-like programming language that compiles to full-vanilla commandblock constructions.
The main concept is that what you write is commandblock logic not code that will be executed and the output will be the logic like in CommandblocksJS. So e.g. `for(i = 0; i < 5; i++) out(i)` in CommandblocksJS would create 5 commandblocks outputting 0 to 5, in CPL it creates a loop outputting a score, adding one to this score and repeat this until the score is 4.

##Example
```javascript
// this example will output radius, circumference and area of circle with radius 1 to 20
fixed pi = math.pi();
fixed circumference = 0.0;
fixed area = 0.0;

tellraw("§cCircle circumference and area for radius 1 to 19§r");
for(fixed i = 1.0; i <= 19; i++)
{
	circumference = i;
	circumference *= 2.0;
	circumference += pi;

	area = i;
	area *= area;
	area += pi;

	tellraw("r = ", i, " C = ", circumference, " A = ", area);
}
```
[![Cmd](http://i.imgur.com/xHyOl5s.png)]()

##Documentation
For a documentation visit the Github wiki: https://github.com/M4GNV5/CPL/wiki
