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

##Features
###Data types
```javascript
// all base types you know from other programming languages are supported
bool myBool = true;
int myInt = 5;
fixed myDecimal = 1.0;
string myString = "hello world";
delegate myDelegate = function()
{
	//...
};
function myFunction(int intArg, string stringArg)
{
	//...
}

//we also have the object keyword for not-base types like selectors
object nearPlayers = @a[r=10];
//but also for using all parts of the CommandblocksJS api
object coins = objective("coins", "dummy");
object notchsCoins = score(coins, @p[name=Notch]);
display.sidebar(coins);
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
	
	for(int i = 0; i < myInt; i++)
	{
		myDecimal += 0.5;
		//out(variable) is a shorthand to tellraw("Output: ", variable)
		out(myDecimal);
	}
}
do
{
	notchsCoins += 25; //someone just bought minecraft
} while(notchsCoins < 666);
```
###Built-in Functions
```javascript
//chat
tellraw(any args...); // tellraw @a args
out(any variable); // shorthand to tellraw("Output: ", variable);
debugging(bool enabled); // show integer values in the scoreboard sidebar

//util
setTimeout(function|delegate callback, int time); // calls callback async after time milliseconds
async(function|delegate callback); //calls callback async
command(string text); //places a commandblock with text as command

//math
math.random(); // returns a random number
math.randomSeed(int seed); //sets the seed for the next random number to seed
math.pi(); // returns 3.14
math.euler(); // returns 2.72

//scoreboard
objective(string name, string type, string displayName); //creates an objective
score(object|string objective, object selector); //gets a single score for use with variables
display.belowName(object objective); //displays objective in displayslot belowName
display.sidebar(object objective); //displays objective in displayslot sidebar
display.list(object objective); //displays objective in displayslot list
```
###Specialities
```javascript
myDelegate("foo"); // wont work - cant give arguments to delegates
myFunction(42, "hello world"); //can give arguments to functions
//note: functions are only for code reuse not for commandblock reuse
//so every function call will build the function delegates are only built once

x = 2 * myInt; // wont work use x = myInt; x *= 2; instead
//anyhow supporting this is a planned feature
```
