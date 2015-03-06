#Commandblock Programming Language
Commandblock Programming Language
is a javascript-like programming language that compiles to full-vanilla commandblock constructions.
The main concept is that what you write is commandblock logic not code that will be executed and the output will be the logic like in CommandblocksJS. So e.g. `for(i = 0; i < 5; i++) out(i)` in CommandblocksJS would create 5 commandblocks outputting 0 to 5, in CPL it creates a loop outputting a score, adding one to this score and repeat this until the score is 4.

##Example
```javascript
// this example will output radius, circumference and area of circle with radius 1 to 20

pi = pi();
radius = 1.0;

while(radius <= 20)
{
	circumference = radius;
	circumference *= 2;
	circumference *= pi;

	area = radius;
	area *= area;
	area *= pi;

	tellraw("r = ", radius, " C = ", circumference, " A = ", area);
	radius += 1;
}
```
[![Cmd](http://i.imgur.com/EkEM8Hn.png)]()

##Features
###Data types
```javascript
// all base types you know from other programming languages are supported
myBool = true;
myInt = 5;
myDecimal = 1.0;
myString = "hello world";
myDelegate = function()
{
	//...
};
```
###Statements
```javascript
while(myBool)
{
	if(myInt < 3)
		tellraw(myString);
	if(myInt >= 3)
	{
		// tellraw(any...) tellraws all parameters to all player
		tellraw("myInt has now a value of ", myInt);
		myBool = false;
	}
	myInt++;
	
	for(i = 0; i < myInt; i++)
	{
		myDecimal += 0.5;
		//out(variable) is a shorthand to tellraw("Output: ", variable)
		out(myDecimal);
	}
}
```
###Built-in Functions
```javascript
//chat
tellraw(args...); // tellraw @a args
out(variable); // shorthand to tellraw("Output: ", variable);
debugging(true|false); // show integer values in the scoreboard sidebar

//util
setTimeout(callback, time); // calls callback after time milliseconds

//math
random(); // returns a random number
intMax(); // returns 2 ^ 31 - 1 (max value for scores)
intMin(); // returns - 2 ^ 31 (min value for scores)
pi(); // returns 3.14
euler(); // returns 2.72
```
###Specialities
```javascript
myDelegate("foo"); // wont work - cant give arguments to delegates
x = 2 * myInt; // wont work use x = myInt; x *= 2; instead

for(i = 0; i < 30; i++)
	x++;
out(x); // will output 10 as everything even bodies of statements are called asynchronously
```
